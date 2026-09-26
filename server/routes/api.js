const express = require("express");
const router = express.Router();

const { getProducts } = require("../controllers/productController");
const {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} = require("../controllers/authController");
const { requireAuth, requireRole } = require("../middleware/requireAuth");
const {
  trackStep,
  getFunnelAnalytics,
} = require("../controllers/trackingController");
const { createOrder } = require("../controllers/orderController");

router.get("/products", getProducts);
router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/logout", logoutUser);
router.post("/track", trackStep);
router.get(
  "/analytics/funnel",
  requireAuth,
  requireRole("admin", "analyst"),
  getFunnelAnalytics,
);
router.post("/order", createOrder);

module.exports = router;
