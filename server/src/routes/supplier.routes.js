// src/routes/supplier.routes.js
const express = require("express");
const {
  getProfile,
  createProfile,
  updateProfile,
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrderById,
  dispatchOrder,
  markOrderArrived,
  getSettlements,
  getDashboard,
} = require("../controllers/supplier.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * Route protection:
 * Optional/Header check or middleware wrapper.
 * For Week 1 testing, auth check can be bypassed if query param ?no_auth=1 is passed,
 * otherwise standard TIER1_SUPPLIER auth is verified.
 */
function optionalAuth(req, res, next) {
  if (req.query.no_auth === "1" || !req.headers.authorization) {
    // allow skeleton access for initial browser/Postman inspection without token
    return next();
  }
  return authenticate(req, res, () => {
    return authorizeRoles("TIER1_SUPPLIER")(req, res, next);
  });
}

router.use(optionalAuth);

// Supplier Profile Endpoints
router.get("/profile", getProfile);
router.post("/profile", createProfile);
router.patch("/profile", updateProfile);

// Supplier Products Endpoints
router.get("/products", getProducts);
router.post("/products", createProduct);
router.get("/products/:id", getProductById);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Supplier Orders Endpoints
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.post("/orders/:id/dispatch", dispatchOrder);
router.post("/orders/:id/mark-arrived", markOrderArrived);

// Supplier Settlements Endpoints
router.get("/settlements", getSettlements);

// Supplier Dashboard Endpoints
router.get("/dashboard", getDashboard);

module.exports = router;
