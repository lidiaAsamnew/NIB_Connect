// src/controllers/supplier.controller.js

/**
 * Supplier Module Controller (Week 1 Foundation Skeleton)
 * Provides skeleton implementations for all planned Tier-1 supplier endpoints.
 */

// Placeholder supplier profile
const mockProfile = {
  id: "sp-uuid-001",
  userId: "supplier-user-001",
  companyName: "Melat Construction Materials & Wholesale",
  tinNumber: "TIN-994827104",
  discountRate: 10.0,
  bankAccountNumber: "CBE-100029384729",
  isVerified: true,
  address: "Bole Subcity, Addis Ababa, Ethiopia",
  contactPerson: "Melat Mehari (+251938768094)",
  createdAt: "2026-10-14T08:00:00.000Z",
  updatedAt: "2026-10-14T08:00:00.000Z",
};

// Placeholder products
const mockProducts = [
  {
    id: "prod-001",
    supplierId: "sp-uuid-001",
    name: "Cement Bag 50kg (Dangote / Mugher)",
    description: "High-grade Portland cement suitable for commercial construction.",
    unitPrice: 850.0,
    stockQuantity: 120,
    isActive: true,
    createdAt: "2026-10-14T08:30:00.000Z",
  },
  {
    id: "prod-002",
    supplierId: "sp-uuid-001",
    name: "Reinforcement Steel Rod 12mm",
    description: "Structural grade deformed steel rebar for concrete reinforcement.",
    unitPrice: 1250.0,
    stockQuantity: 85,
    isActive: true,
    createdAt: "2026-10-14T09:00:00.000Z",
  },
  {
    id: "prod-003",
    supplierId: "sp-uuid-001",
    name: "Commercial Paint 20L White",
    description: "Weather-resistant exterior and interior acrylic emulsion.",
    unitPrice: 3200.0,
    stockQuantity: 8, // Low stock alert test
    isActive: true,
    createdAt: "2026-10-14T09:15:00.000Z",
  },
];

// Placeholder orders
const mockOrders = [
  {
    id: "ORD-8821",
    orderId: "ORD-8821",
    startupBusinessName: "Lidia Agro Supplies",
    supplierName: "Melat Construction Materials & Wholesale",
    grossAmount: "10000.00",
    discountApplied: "1000.00",
    netAmountToPay: "9000.00",
    status: "PLACED",
    waybillCode: null,
    items: [
      {
        productId: "prod-001",
        productName: "Cement Bag 50kg",
        quantity: 10,
        unitPrice: "850.00",
        total: "8500.00",
      },
    ],
    createdAt: "2026-10-14T10:00:00.000Z",
  },
  {
    id: "ORD-8822",
    orderId: "ORD-8822",
    startupBusinessName: "Bole Fashion & Textiles",
    supplierName: "Melat Construction Materials & Wholesale",
    grossAmount: "15000.00",
    discountApplied: "1500.00",
    netAmountToPay: "13500.00",
    status: "DISPATCHED_IN_TRANSIT",
    waybillCode: "WB-20261014-8F3A21",
    dispatchedAt: "2026-10-14T11:00:00.000Z",
    items: [
      {
        productId: "prod-002",
        productName: "Reinforcement Steel Rod 12mm",
        quantity: 10,
        unitPrice: "1250.00",
        total: "12500.00",
      },
    ],
    createdAt: "2026-10-14T10:30:00.000Z",
  },
];

// Profile endpoints
function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: mockProfile,
    message: "Supplier profile retrieved successfully",
  });
}

function createProfile(req, res) {
  return res.status(201).json({
    success: true,
    data: { ...mockProfile, ...req.body },
    message: "Supplier profile created successfully (placeholder)",
  });
}

function updateProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: { ...mockProfile, ...req.body },
    message: "Supplier profile updated successfully (placeholder)",
  });
}

// Product endpoints
function getProducts(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.toLowerCase() || "";

  let filtered = mockProducts;
  if (search) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
  }

  return res.status(200).json({
    success: true,
    data: filtered,
    meta: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
    message: "Supplier products retrieved successfully",
  });
}

function createProduct(req, res) {
  const newProduct = {
    id: `prod-${Date.now()}`,
    supplierId: "sp-uuid-001",
    name: req.body.name || "New Product",
    description: req.body.description || "",
    unitPrice: req.body.unitPrice || 0,
    stockQuantity: req.body.stockQuantity || 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  return res.status(201).json({
    success: true,
    data: newProduct,
    message: "Product created successfully (placeholder)",
  });
}

function getProductById(req, res) {
  const { id } = req.params;
  const product = mockProducts.find((p) => p.id === id) || mockProducts[0];
  return res.status(200).json({
    success: true,
    data: product,
  });
}

function updateProduct(req, res) {
  const { id } = req.params;
  return res.status(200).json({
    success: true,
    data: { id, ...req.body },
    message: "Product updated successfully (placeholder)",
  });
}

function deleteProduct(req, res) {
  const { id } = req.params;
  return res.status(200).json({
    success: true,
    data: { id, isActive: false },
    message: "Product deactivated successfully (placeholder)",
  });
}

// Order endpoints
function getOrders(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;

  let filtered = mockOrders;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  return res.status(200).json({
    success: true,
    data: filtered,
    meta: {
      page,
      limit,
      total: filtered.length,
      totalPages: 1,
    },
    message: "Supplier orders retrieved successfully",
  });
}

function getOrderById(req, res) {
  const { id } = req.params;
  const order = mockOrders.find((o) => o.id === id || o.orderId === id) || mockOrders[0];
  return res.status(200).json({
    success: true,
    data: order,
    message: "Order details retrieved successfully",
  });
}

function dispatchOrder(req, res) {
  const { id } = req.params;
  const waybillCode = `WB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return res.status(200).json({
    success: true,
    message: "Order dispatched successfully.",
    data: {
      orderId: id,
      status: "DISPATCHED_IN_TRANSIT",
      waybillCode,
      dispatchedAt: new Date().toISOString(),
    },
  });
}

function markOrderArrived(req, res) {
  const { id } = req.params;
  return res.status(200).json({
    success: true,
    message: "Order marked as arrived. Waiting for beneficiary delivery handshake.",
    data: {
      orderId: id,
      status: "DELIVERED_PENDING_HANDSHAKE",
      arrivedAt: new Date().toISOString(),
    },
  });
}

// Settlement endpoints
function getSettlements(req, res) {
  return res.status(200).json({
    success: true,
    data: [
      {
        orderId: "ORD-7719",
        waybillCode: "WB-20261012-7A1B99",
        startupBusinessName: "Lidia Agro Supplies",
        grossAmount: "10000.00",
        discountApplied: "1000.00",
        netAmountToPay: "9000.00",
        clearedAt: "2026-10-14T12:30:00.000Z",
        settlementReference: "NIB-TXN-99321",
        status: "VERIFIED_AND_CLEARED",
      },
    ],
    message: "Supplier settlements retrieved successfully",
  });
}

// Dashboard endpoints
function getDashboard(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      totalProducts: 25,
      activeProducts: 22,
      lowStockProducts: 4,
      outOfStockProducts: 2,
      totalOrders: 18,
      ordersByStatus: {
        PLACED: 3,
        DISPATCHED_IN_TRANSIT: 2,
        DELIVERED_PENDING_HANDSHAKE: 1,
        VERIFIED_AND_CLEARED: 12,
      },
      totalSalesValue: "180000.00",
      totalSettledValue: "120000.00",
      totalDiscountGiven: "18000.00",
    },
    message: "Supplier dashboard metrics retrieved successfully",
  });
}

module.exports = {
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
};
