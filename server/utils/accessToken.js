const { createHmac, timingSafeEqual } = require("node:crypto");

const accessTokenLifetimeSeconds = 15 * 60;

const getAccessTokenSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("JWT_ACCESS_SECRET must contain at least 32 bytes");
  }
  return secret;
};

const sign = (value) =>
  createHmac("sha256", getAccessTokenSecret()).update(value).digest("base64url");

const createAccessToken = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + accessTokenLifetimeSeconds,
    }),
  ).toString("base64url");
  const unsignedToken = `${header}.${payload}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
};

const verifyAccessToken = (token) => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const expectedSignature = Buffer.from(sign(unsignedToken));
  const actualSignature = Buffer.from(parts[2]);
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (
      header.alg !== "HS256" ||
      header.typ !== "JWT" ||
      typeof claims.sub !== "string" ||
      typeof claims.email !== "string" ||
      !["client", "admin", "analyst"].includes(claims.role) ||
      typeof claims.exp !== "number" ||
      claims.exp <= now
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
};

module.exports = { createAccessToken, verifyAccessToken };
