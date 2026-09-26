const { createHash, randomBytes } = require("node:crypto");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { createAccessToken } = require("../utils/accessToken");

const refreshCookieName = "northstar_refresh";
const refreshTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: refreshTokenLifetimeMs,
});

const getRefreshToken = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${refreshCookieName}=`));

  return cookie ? decodeURIComponent(cookie.slice(refreshCookieName.length + 1)) : null;
};

const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const createRefreshToken = () => randomBytes(48).toString("base64url");

const setRefreshCookie = (res, token) =>
  res.cookie(refreshCookieName, token, getCookieOptions());

const clearRefreshCookie = (res) =>
  res.clearCookie(refreshCookieName, getCookieOptions());

const issueTokens = async (user, query = pool.query.bind(pool)) => {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + refreshTokenLifetimeMs);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [String(user.id), hashRefreshToken(refreshToken), expiresAt],
  );

  return {
    accessToken: createAccessToken(user),
    refreshToken,
  };
};

const registerUser = async (req, res) => {
  const body =
    req.body && typeof req.body === "object" ? req.body : {};
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Укажите корректный email и пароль от 8 символов (до 72 байт)",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, 'client')
       RETURNING id, email, role`,
      [email, passwordHash],
    );
    const user = result.rows[0];
    const tokens = await issueTokens(user);

    setRefreshCookie(res, tokens.refreshToken);
    return res.status(201).json({
      success: true,
      user,
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Этот email уже зарегистрирован" });
    }
    console.error("Registration failed:", err);
    return res.status(500).json({
      success: false,
      message: "Не удалось создать аккаунт",
    });
  }
};

const loginUser = async (req, res) => {
  const body =
    req.body && typeof req.body === "object" ? req.body : {};
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;

  if (!email || typeof password !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Укажите email и пароль" });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password, role FROM users WHERE email = $1`,
      [email],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Неверный email или пароль" });
    }

    const tokens = await issueTokens(user);
    setRefreshCookie(res, tokens.refreshToken);
    return res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    console.error("Login failed:", err);
    return res
      .status(500)
      .json({ success: false, message: "Не удалось выполнить вход" });
  }
};

const refreshAccessToken = async (req, res) => {
  let refreshToken;
  try {
    refreshToken = getRefreshToken(req);
  } catch {
    clearRefreshCookie(res);
    return res
      .status(401)
      .json({ success: false, message: "Refresh token недействителен" });
  }
  if (!refreshToken) {
    return res.status(204).end();
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT rt.id, u.id AS user_id, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id::text = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()
       FOR UPDATE OF rt`,
      [hashRefreshToken(refreshToken)],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      clearRefreshCookie(res);
      return res
        .status(401)
        .json({ success: false, message: "Refresh token недействителен или истёк" });
    }

    const user = result.rows[0];
    const tokens = await issueTokens(
      { id: user.user_id, email: user.email, role: user.role },
      client.query.bind(client),
    );
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [result.rows[0].id],
    );
    await client.query("COMMIT");

    setRefreshCookie(res, tokens.refreshToken);
    return res.json({
      success: true,
      user: { id: user.user_id, email: user.email, role: user.role },
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Token refresh rollback failed:", rollbackError);
      }
    }
    console.error("Token refresh failed:", err);
    return res
      .status(500)
      .json({ success: false, message: "Не удалось обновить токен" });
  } finally {
    if (client) client.release();
  }
};

const logoutUser = async (req, res) => {
  let refreshToken;
  try {
    refreshToken = getRefreshToken(req);
    if (refreshToken) {
      await pool.query(
        `UPDATE refresh_tokens
         SET revoked_at = NOW()
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [hashRefreshToken(refreshToken)],
      );
    }
  } catch (err) {
    console.error("Logout failed:", err);
    return res
      .status(500)
      .json({ success: false, message: "Не удалось завершить сессию" });
  }

  clearRefreshCookie(res);
  return res.status(204).end();
};

module.exports = {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
};
