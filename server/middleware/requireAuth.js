const { verifyAccessToken } = require("../utils/accessToken");

const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  const match =
    typeof authorization === "string" &&
    authorization.match(/^Bearer ([^\s]+)$/);
  if (!match) {
    return res
      .status(401)
      .json({ success: false, message: "Требуется авторизация" });
  }

  try {
    const user = verifyAccessToken(match[1]);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Access token недействителен или истёк" });
    }
    req.user = user;
    return next();
  } catch (err) {
    console.error("Access token verification failed:", err);
    return res
      .status(500)
      .json({ success: false, message: "Ошибка проверки авторизации" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ success: false, message: "Недостаточно прав" });
  }
  return next();
};

module.exports = { requireAuth, requireRole };
