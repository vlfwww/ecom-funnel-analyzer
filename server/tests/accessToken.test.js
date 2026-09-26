const { createHmac } = require("node:crypto");
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_ACCESS_SECRET = "test-only-secret-with-at-least-32-bytes";

const { createAccessToken, verifyAccessToken } = require("../utils/accessToken");
const { requireAuth, requireRole } = require("../middleware/requireAuth");
const pool = require("../config/db");
const { registerUser } = require("../controllers/authController");

test("access token contains the signed user's identity and role", () => {
  const token = createAccessToken({
    id: 42,
    email: "customer@example.com",
    role: "client",
  });

  assert.deepEqual(
    Object.fromEntries(
      Object.entries(verifyAccessToken(token)).filter(([key]) =>
        ["sub", "email", "role"].includes(key),
      ),
    ),
    { sub: "42", email: "customer@example.com", role: "client" },
  );
});

test("rejects a token whose payload has been changed", () => {
  const token = createAccessToken({
    id: 1,
    email: "customer@example.com",
    role: "client",
  });
  const [header, , signature] = token.split(".");
  const alteredPayload = Buffer.from(
    JSON.stringify({
      sub: "1",
      email: "customer@example.com",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 60,
    }),
  ).toString("base64url");

  assert.equal(verifyAccessToken(`${header}.${alteredPayload}.${signature}`), null);
});

test("rejects expired access tokens", () => {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "1",
      email: "customer@example.com",
      role: "client",
      exp: Math.floor(Date.now() / 1000) - 1,
    }),
  ).toString("base64url");
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", process.env.JWT_ACCESS_SECRET)
    .update(unsignedToken)
    .digest("base64url");

  assert.equal(verifyAccessToken(`${unsignedToken}.${signature}`), null);
});

test("authorization middleware enforces token and role requirements", () => {
  const token = createAccessToken({
    id: 1,
    email: "customer@example.com",
    role: "client",
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let authenticated = false;

  requireAuth(req, res, () => {
    authenticated = true;
  });
  assert.equal(authenticated, true);

  let authorized = false;
  requireRole("admin")(req, res, () => {
    authorized = true;
  });
  assert.equal(authorized, false);
  assert.equal(res.statusCode, 403);
});

test("public registration always creates a client, ignoring a supplied role", async () => {
  const originalQuery = pool.query;
  const insertStatements = [];
  pool.query = async (statement, params) => {
    insertStatements.push({ statement, params });
    if (statement.includes("INSERT INTO users")) {
      return {
        rows: [{ id: 7, email: "new@example.com", role: "client" }],
      };
    }
    return { rows: [] };
  };

  const res = {
    statusCode: 200,
    body: null,
    cookieName: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name) {
      this.cookieName = name;
      return this;
    },
  };

  try {
    await registerUser(
      {
        body: {
          email: " NEW@example.com ",
          password: "secure-password",
          role: "admin",
        },
      },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.user.role, "client");
    assert.equal(res.cookieName, "northstar_refresh");
    assert.equal(insertStatements[0].params[0], "new@example.com");
    assert.match(insertStatements[0].statement, /VALUES \(\$1, \$2, 'client'\)/);
    assert.equal(insertStatements[0].params.length, 2);
  } finally {
    pool.query = originalQuery;
  }
});
