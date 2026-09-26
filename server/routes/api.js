const express = require("express");
const router = express.Router();

const {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} = require("../controllers/productController");
const { getUsers } = require("../controllers/userController");
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
const { createOrder, getOrders } = require("../controllers/orderController");

router.get("/products", requireAuth, getProducts);
router.post("/products", requireAuth, requireRole("admin"), createProduct);
router.put("/products/:id", requireAuth, requireRole("admin"), updateProduct);
router.delete(
  "/products/:id",
  requireAuth,
  requireRole("admin"),
  deleteProduct,
);
router.get("/users", requireAuth, requireRole("admin"), getUsers);
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
router.get("/orders", requireAuth, requireRole("admin"), getOrders);
router.post("/order", requireAuth, requireRole("client", "analyst"), createOrder);

module.exports = router;
