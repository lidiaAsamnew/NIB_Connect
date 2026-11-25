const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");

const jwtSecret = "operations-test-secret-that-is-long-enough";
const operator = {
  id: randomUUID(),
  fullName: "Operator Test",
  email: "operator@example.test",
  phoneNumber: "+251911000101",
  role: "NIB_SYSTEM_OPERATOR",
  isActive: true,
};
const owner = {
  id: randomUUID(),
  fullName: "Startup Test",
  email: "owner@example.test",
  phoneNumber: "+251911000102",
  role: "WOMEN_STARTUP_OWNER",
  isActive: true,
};
const supplierUser = {
  id: randomUUID(),
  fullName: "Supplier Test",
  email: "supplier@example.test",
  phoneNumber: "+251911000103",
  role: "TIER1_SUPPLIER",
  isActive: true,
};
const startupId = randomUUID();
const supplierId = randomUUID();
const voucherId = randomUUID();
const orderId = randomUUID();
const productId = randomUUID();
const overdueVoucherId = randomUUID();
const futureVoucherId = randomUUID();
const legacyExpiredVoucherId = randomUUID();
const users = [operator, owner, supplierUser, {
  id: randomUUID(),
  fullName: "EU Test",
  email: "eu@example.test",
  phoneNumber: "+251911000104",
  role: "EU_COMPLIANCE_OFFICER",
  isActive: true,
}];
const supplierProfiles = [{
  id: supplierId,
  userId: supplierUser.id,
  companyName: "Verified Supply Co",
  tinNumber: "TIN-OPS-001",
  discountRate: "12.50",
  bankAccountNumber: "never-return-this",
  address: "Addis Ababa",
  contactPerson: "Supplier Contact",
  isVerified: false,
  verifiedAt: null,
  verifiedById: null,
  verificationRemarks: null,
  createdAt: new Date("2026-11-15T10:00:00.000Z"),
  updatedAt: new Date("2026-11-15T10:00:00.000Z"),
  user: { id: supplierUser.id, fullName: supplierUser.fullName, email: supplierUser.email },
  verifiedBy: null,
}];
const startups = [{
  id: startupId,
  userId: owner.id,
  businessName: "Startup Example",
  sector: "Manufacturing",
  region: "Addis Ababa",
}];
owner.startupProfile = startups[0];
supplierUser.supplierProfile = supplierProfiles[0];
const vouchers = [
  {
    id: voucherId,
    recipientUserId: owner.id,
    allocatedByUserId: operator.id,
    startupId,
    amount: "100.25",
    status: "ACTIVE",
    createdAt: new Date("2026-11-15T10:00:00.000Z"),
    expiresAt: null,
    recipient: { id: owner.id, fullName: owner.fullName, startupProfile: startups[0] },
    startup: startups[0],
    committedOrder: null,
  },
  {
    id: randomUUID(),
    recipientUserId: owner.id,
    allocatedByUserId: operator.id,
    startupId,
    amount: "20.00",
    status: "COMMITTED_TO_ORDER",
    createdAt: new Date("2026-11-14T10:00:00.000Z"),
    expiresAt: null,
    recipient: { id: owner.id, fullName: owner.fullName, startupProfile: startups[0] },
    startup: startups[0],
    committedOrder: { id: orderId, status: "PLACED" },
  },
  {
    id: randomUUID(),
    recipientUserId: owner.id,
    allocatedByUserId: operator.id,
    startupId,
    amount: "5.00",
    status: "REDEEMED_AND_SETTLED",
    createdAt: new Date("2026-11-13T10:00:00.000Z"),
    expiresAt: null,
    recipient: { id: owner.id, fullName: owner.fullName, startupProfile: startups[0] },
    startup: startups[0],
    committedOrder: null,
  },
  {
    id: overdueVoucherId,
    recipientUserId: owner.id,
    allocatedByUserId: operator.id,
    startupId,
    amount: "15.00",
    status: "ALLOCATED",
    createdAt: new Date("2026-11-12T10:00:00.000Z"),
    expiresAt: new Date("2026-11-13T10:00:00.000Z"),
    recipient: { id: owner.id, fullName: owner.fullName, startupProfile: startups[0] },
    startup: startups[0],
    committedOrder: null,
  },
  {
    id: futureVoucherId,
    recipientUserId: owner.id,
    allocatedByUserId: operator.id,
    startupId,
    amount: "25.00",
    status: "ALLOCATED",
    createdAt: new Date("2026-11-12T10:00:00.000Z"),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    recipient: { id: owner.id, fullName: owner.fullName, startupProfile: startups[0] },
    startup: startups[0],
    committedOrder: null,
  },
  {
    id: legacyExpiredVoucherId,
    recipientUserId: owner.id,
    allocatedByUserId: operator.id,
    startupId,
    amount: "30.00",
    status: "ACTIVE",
    createdAt: new Date("2026-11-12T10:00:00.000Z"),
    expiresAt: new Date("2026-11-13T10:00:00.000Z"),
    recipient: { id: owner.id, fullName: owner.fullName, startupProfile: startups[0] },
    startup: startups[0],
    committedOrder: null,
  },
];
const orders = [{
  id: orderId,
  startupId,
  supplierId,
  voucherId,
  grossAmount: "100.00",
  discountApplied: "12.50",
  netAmountToPay: "87.50",
  status: "DELIVERED_PENDING_HANDSHAKE",
  waybillCode: "WB-OPS-001",
  createdAt: new Date("2026-11-15T09:00:00.000Z"),
  dispatchedAt: new Date("2026-11-15T10:00:00.000Z"),
  arrivedAt: new Date("2026-11-15T11:00:00.000Z"),
  clearedAt: null,
  startup: startups[0],
  supplier: { id: supplierId, companyName: "Verified Supply Co" },
  items: [{
    id: randomUUID(),
    quantity: 1,
    unitPrice: "100.00",
    lineTotal: "100.00",
    product: { id: productId, name: "Building material" },
  }],
  handshakes: [{
    id: randomUUID(),
    success: false,
    message: "Invalid attempt",
    attemptedAt: new Date("2026-11-15T12:00:00.000Z"),
    otpHash: "must-not-be-returned",
    ipAddress: "192.0.2.1",
  }],
  escrowTransactions: [{
    id: randomUUID(),
    direction: "DEBIT",
    amount: "87.50",
    status: "SUCCESS",
    description: "Escrow funded",
    createdAt: new Date("2026-11-15T09:30:00.000Z"),
    reference: "must-not-be-returned",
  }],
}];
const escrowTransactions = [
  { id: randomUUID(), orderId, direction: "DEBIT", amount: "87.50", status: "SUCCESS", description: "Escrow funded", createdAt: new Date() },
  { id: randomUUID(), orderId, direction: "CREDIT", amount: "12.50", status: "SUCCESS", description: "Settlement", createdAt: new Date() },
  { id: randomUUID(), orderId, direction: "DEBIT", amount: "9.00", status: "FAILED", description: "Failed transaction", createdAt: new Date() },
];
const securityEvents = [{
  id: randomUUID(),
  userId: owner.id,
  orderId,
  ipAddress: "192.0.2.1",
  eventType: "SUSPICIOUS_OTP_ATTEMPT",
  message: "A suspicious OTP attempt was recorded.",
  metadata: {
    otpHash: "must-not-be-returned",
    orderId,
    details: { accessToken: "must-also-be-hidden", attemptCount: 5 },
  },
  createdAt: new Date(),
  user: owner,
}, {
  id: randomUUID(),
  userId: supplierUser.id,
  orderId: randomUUID(),
  ipAddress: "198.51.100.2",
  eventType: "LOGIN_FAILED",
  message: "A login attempt failed.",
  metadata: null,
  createdAt: new Date(),
  user: supplierUser,
}];
const auditLogs = [];
const notifications = [
  {
    id: randomUUID(),
    userId: operator.id,
    title: "Supplier verification is overdue",
    message: "A supplier needs review.",
    type: "SUPPLIER_PENDING_VERIFICATION",
    isRead: false,
    link: "/operator/suppliers",
    relatedEntityId: supplierId,
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    userId: operator.id,
    title: "Order needs confirmation",
    message: "An order is waiting for beneficiary confirmation.",
    type: "ORDER_PENDING_HANDSHAKE_TOO_LONG",
    isRead: false,
    link: "/operator/orders",
    relatedEntityId: orderId,
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    userId: operator.id,
    title: "Earlier alert",
    message: "This alert was reviewed.",
    type: "FAILED_LOGIN_SPIKE",
    isRead: true,
    link: "/operator/dashboard",
    relatedEntityId: null,
    createdAt: new Date("2026-11-14T10:00:00.000Z"),
  },
  {
    id: randomUUID(),
    userId: owner.id,
    title: "Voucher allocated",
    message: "A voucher is available.",
    type: "VOUCHER_ALLOCATED",
    isRead: false,
    link: "/me",
    relatedEntityId: voucherId,
    createdAt: new Date(),
  },
];

function matchesWhere(record, where = {}) {
  for (const [key, expected] of Object.entries(where)) {
    if (key === "AND" && !expected.every((clause) => matchesWhere(record, clause))) return false;
    if (key === "OR" && !expected.some((clause) => matchesWhere(record, clause))) return false;
    if (key === "AND" || key === "OR") continue;
    const actual = record[key];
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      if ("is" in expected && !matchesWhere(actual || {}, expected.is)) return false;
      if ("contains" in expected && !String(actual || "").includes(expected.contains)) return false;
      if ("in" in expected && !expected.in.includes(actual)) return false;
      if ("gte" in expected && !(actual >= expected.gte)) return false;
      if ("lte" in expected && !(actual <= expected.lte)) return false;
      if ("lt" in expected && !(actual < expected.lt)) return false;
      if ("isVerified" in expected && !matchesWhere(actual || {}, expected)) return false;
      if (!["is", "contains", "in", "gte", "lte", "lt", "isVerified"].some((operator) => operator in expected) &&
          !matchesWhere(actual || {}, expected)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

function project(record, select) {
  if (!select) return record;
  if (Array.isArray(record)) return record.map((item) => project(item, select));
  if (!record || typeof record !== "object") return record;
  const result = {};
  for (const [key, selection] of Object.entries(select)) {
    if (selection === true) {
      result[key] = record[key];
    } else if (selection && typeof selection === "object" && "select" in selection) {
      result[key] = project(record[key], selection.select);
    }
  }
  return result;
}

function model(records) {
  return {
    async findMany({ where = {}, select, skip = 0, take = 100, orderBy } = {}) {
      let items = records.filter((record) => matchesWhere(record, where));
      if (orderBy && !Array.isArray(orderBy)) {
        const [key, direction] = Object.entries(orderBy)[0];
        items = items.slice().sort((a, b) => direction === "asc"
          ? a[key] - b[key]
          : b[key] - a[key]);
      }
      return items.slice(skip, skip + take).map((item) => project(item, select));
    },
    async findUnique({ where, select }) {
      const item = records.find((record) => matchesWhere(record, where));
      return item ? project(item, select) : null;
    },
    async findFirst({ where = {}, select } = {}) {
      const item = records.find((record) => matchesWhere(record, where));
      return item ? project(item, select) : null;
    },
    async count({ where = {} } = {}) {
      return records.filter((record) => matchesWhere(record, where)).length;
    },
    async groupBy({ by, where = [], _sum, _count } = {}) {
      const grouped = new Map();
      for (const record of records.filter((item) => matchesWhere(item, where))) {
        const key = by.map((field) => record[field]).join("|");
        const group = grouped.get(key) || {
          ...Object.fromEntries(by.map((field) => [field, record[field]])),
          count: 0,
          sum: {},
        };
        group.count += 1;
        for (const field of Object.keys(_sum || {})) {
          group.sum[field] = (group.sum[field] || 0) + Number(record[field] || 0);
        }
        grouped.set(key, group);
      }
      return [...grouped.values()].map((group) => ({
        ...Object.fromEntries(Object.keys(_sum || {}).map((field) => [field, undefined])),
        ...Object.fromEntries(by.map((field) => [field, group[field]])),
        ...(_sum ? { _sum: group.sum } : {}),
        ...(_count ? { _count: { _all: group.count, id: group.count } } : {}),
      }));
    },
    async aggregate({ where = {}, _sum } = {}) {
      const filtered = records.filter((record) => matchesWhere(record, where));
      return {
        _sum: Object.fromEntries(Object.keys(_sum || {}).map((field) => [
          field,
          filtered.reduce((total, record) => total + Number(record[field] || 0), 0) || null,
        ])),
      };
    },
    async create({ data }) {
      const record = { id: randomUUID(), ...data, createdAt: new Date() };
      if (records === auditLogs) {
        record.actor = users.find((user) => user.id === data.actorId) || null;
      }
      records.push(record);
      return record;
    },
    async update({ where, data, select }) {
      const record = records.find((item) => matchesWhere(item, where));
      if (!record) return null;
      Object.assign(record, data);
      return project(record, select);
    },
    async updateMany({ where, data }) {
      const matched = records.filter((record) => matchesWhere(record, where));
      for (const record of matched) Object.assign(record, data);
      return { count: matched.length };
    },
  };
}

const prisma = {
  user: model(users),
  startupProfile: model(startups),
  supplierProfile: model(supplierProfiles),
  voucher: model(vouchers),
  product: model([
    { id: productId, name: "Verified item", price: 30, stockQuantity: 4, isActive: true, supplier: { id: supplierId, companyName: "Verified Supply Co", isVerified: true } },
    { id: randomUUID(), name: "Unverified item", price: 20, stockQuantity: 5, isActive: true, supplier: { id: randomUUID(), companyName: "Unverified Supply Co", isVerified: false } },
    { id: randomUUID(), name: "Inactive item", price: 10, stockQuantity: 0, isActive: false, supplier: { id: supplierId, companyName: "Verified Supply Co", isVerified: true } },
  ]),
  order: model(orders),
  notification: model(notifications),
  escrowTransaction: model(escrowTransactions),
  securityEvent: model(securityEvents),
  auditLog: model(auditLogs),
  async $transaction(callback) {
    return callback(prisma);
  },
};

let server;
let baseUrl;

function tokenFor(user) {
  return jwt.sign({ role: user.role, email: user.email }, jwtSecret, { subject: user.id });
}

before(async () => {
  const app = createApp({ prisma, jwtSecret });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { response, data: await response.json() };
}

test("operator dashboard is role-protected and reports current metrics without secrets", async () => {
  const missing = await request("/api/ops/dashboard");
  assert.equal(missing.response.status, 401);

  const forbidden = await request("/api/ops/dashboard", { token: tokenFor(owner) });
  assert.equal(forbidden.response.status, 403);

  const result = await request("/api/ops/dashboard", { token: tokenFor(operator) });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.data.users.total, users.length);
  assert.equal(result.data.data.startups.total, 1);
  assert.equal(result.data.data.suppliers.total, 1);
  assert.equal(result.data.data.suppliers.unverified, 1);
  assert.equal(result.data.data.vouchers.allocatedValue, "170.25");
  assert.equal(result.data.data.vouchers.committedValue, "20.00");
  assert.equal(result.data.data.vouchers.settledValue, "5.00");
  assert.equal(result.data.data.orders.pendingHandshake, 1);
  assert.equal(result.data.data.security.suspiciousOtpAttemptsLast24Hours, 1);
  assert.equal(JSON.stringify(result.data).includes("otpHash"), false);
});

test("supplier verification is operator-only, audited, and never returns bank details", async () => {
  const result = await request(`/api/ops/suppliers/${supplierId}/verify`, {
    method: "PATCH",
    token: tokenFor(operator),
    body: { remarks: "Documents checked and tax details verified." },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.data.isVerified, true);
  assert.equal(result.data.data.auditLogId.length > 0, true);
  assert.equal(supplierProfiles[0].verifiedById, operator.id);
  assert.equal(auditLogs.some((log) => log.action === "SUPPLIER_VERIFIED"), true);
  assert.equal(JSON.stringify(result.data).includes("bankAccountNumber"), false);

  const invalid = await request(`/api/ops/suppliers/${supplierId}/unverify`, {
    method: "PATCH",
    token: tokenFor(operator),
    body: { remarks: "x" },
  });
  assert.equal(invalid.response.status, 400);
});

test("operator can safely deactivate and reactivate users with audit history", async () => {
  const usersList = await request("/api/ops/users?search=Startup&status=active", {
    token: tokenFor(operator),
  });
  assert.equal(usersList.response.status, 200);
  assert.equal(usersList.data.data.total, 1);
  assert.equal(usersList.data.data.items[0].id, owner.id);
  assert.equal(JSON.stringify(usersList.data).includes("passwordHash"), false);

  const details = await request(`/api/ops/users/${supplierUser.id}`, { token: tokenFor(operator) });
  assert.equal(details.response.status, 200);
  assert.equal(details.data.data.supplierProfile.companyName, supplierProfiles[0].companyName);
  assert.equal(JSON.stringify(details.data).includes("bankAccountNumber"), false);
  assert.equal(JSON.stringify(details.data).includes("tinNumber"), false);

  const selfDeactivation = await request(`/api/ops/users/${operator.id}/deactivate`, {
    method: "PATCH",
    token: tokenFor(operator),
  });
  assert.equal(selfDeactivation.response.status, 409);

  const deactivation = await request(`/api/ops/users/${owner.id}/deactivate`, {
    method: "PATCH",
    token: tokenFor(operator),
  });
  assert.equal(deactivation.response.status, 200);
  assert.equal(deactivation.data.data.isActive, false);
  assert.ok(auditLogs.some((log) => log.action === "USER_DEACTIVATED" && log.entityId === owner.id));
  assert.ok(notifications.some((item) =>
    item.userId === owner.id && item.type === "ACCOUNT_DEACTIVATED"
  ));

  const blockedToken = await request("/api/users/me", { token: tokenFor(owner) });
  assert.equal(blockedToken.response.status, 403);
  assert.equal(blockedToken.data.message, "Your account is deactivated. Contact NIB operations.");
  assert.ok(securityEvents.some((event) =>
    event.eventType === "DEACTIVATED_ACCOUNT_ACCESS" && event.userId === owner.id
  ));

  const activation = await request(`/api/ops/users/${owner.id}/activate`, {
    method: "PATCH",
    token: tokenFor(operator),
  });
  assert.equal(activation.response.status, 200);
  assert.equal(activation.data.data.isActive, true);
  assert.ok(auditLogs.some((log) => log.action === "USER_ACTIVATED" && log.entityId === owner.id));

  const from = new Date().toISOString().slice(0, 10);
  const auditQuery = new URLSearchParams({
    actor: operator.fullName,
    action: "USER_DEACTIVATED",
    entityType: "USER",
    entityId: owner.id,
    from,
    to: from,
  });
  const auditResult = await request(`/api/audit-logs?${auditQuery}`, { token: tokenFor(operator) });
  assert.equal(auditResult.response.status, 200);
  assert.equal(auditResult.data.data.total, 1);
  assert.equal(auditResult.data.data.items[0].actor.fullName, operator.fullName);

  const denied = await request("/api/ops/users", { token: tokenFor(supplierUser) });
  assert.equal(denied.response.status, 403);
});

test("operator can expire only overdue allocated vouchers and audit each change", async () => {
  const beneficiaryDenied = await request("/api/ops/vouchers/expire-overdue", {
    method: "POST",
    token: tokenFor(owner),
  });
  assert.equal(beneficiaryDenied.response.status, 403);

  const result = await request("/api/ops/vouchers/expire-overdue", {
    method: "POST",
    token: tokenFor(operator),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.data.expiredCount, 1);
  assert.equal(vouchers.find((voucher) => voucher.id === overdueVoucherId).status, "EXPIRED");
  assert.equal(vouchers.find((voucher) => voucher.id === futureVoucherId).status, "ALLOCATED");
  assert.equal(vouchers.find((voucher) => voucher.id === legacyExpiredVoucherId).status, "ACTIVE");
  assert.equal(auditLogs.filter((log) =>
    log.action === "VOUCHER_EXPIRED" && log.entityId === overdueVoucherId
  ).length, 1);
});

test("notifications are owner-scoped and can be marked read individually or in bulk", async () => {
  const operatorList = await request("/api/notifications?unreadOnly=true", {
    token: tokenFor(operator),
  });
  assert.equal(operatorList.response.status, 200);
  assert.equal(operatorList.data.data.total, 2);
  assert.equal(operatorList.data.data.unreadCount, 2);
  assert.equal(operatorList.data.data.items.some((item) => item.type === "VOUCHER_ALLOCATED"), false);

  const ownerList = await request("/api/notifications", { token: tokenFor(owner) });
  assert.equal(ownerList.response.status, 200);
  assert.equal(ownerList.data.data.total, 2);
  assert.equal(ownerList.data.data.items.some((item) => item.type === "VOUCHER_ALLOCATED"), true);
  assert.equal(ownerList.data.data.items.some((item) => item.type === "SUPPLIER_PENDING_VERIFICATION"), false);

  const anotherUsersNotification = operatorList.data.data.items[0].id;
  const denied = await request(`/api/notifications/${anotherUsersNotification}/read`, {
    method: "PATCH",
    token: tokenFor(owner),
  });
  assert.equal(denied.response.status, 404);

  const marked = await request(`/api/notifications/${anotherUsersNotification}/read`, {
    method: "PATCH",
    token: tokenFor(operator),
  });
  assert.equal(marked.response.status, 200);
  assert.equal(marked.data.data.isRead, true);

  const markAll = await request("/api/notifications/read-all", {
    method: "PATCH",
    token: tokenFor(operator),
  });
  assert.equal(markAll.response.status, 200);
  assert.equal(markAll.data.data.updatedCount, 1);
});

test("voucher and order monitoring validate filters and omit OTP material", async () => {
  const invalidFilter = await request("/api/ops/vouchers?status=INVALID", { token: tokenFor(operator) });
  assert.equal(invalidFilter.response.status, 400);

  const voucherList = await request("/api/ops/vouchers?status=ACTIVE&amountMin=50", {
    token: tokenFor(operator),
  });
  assert.equal(voucherList.response.status, 200);
  assert.equal(voucherList.data.data.items.length, 1);
  assert.equal(voucherList.data.data.items[0].startupBusinessName, "Startup Example");

  const orderDetail = await request(`/api/ops/orders/${orderId}`, { token: tokenFor(operator) });
  assert.equal(orderDetail.response.status, 200);
  assert.equal(orderDetail.data.data.handshakes.length, 1);
  assert.equal(JSON.stringify(orderDetail.data).includes("otpHash"), false);
  assert.equal(JSON.stringify(orderDetail.data).includes("reference"), false);
});

test("operator security events support scoped filters and redact secret metadata", async () => {
  const query = new URLSearchParams({
    eventType: "SUSPICIOUS_OTP_ATTEMPT",
    userId: owner.id,
    orderId,
    ipAddress: "192.0.2.1",
    page: "1",
    limit: "10",
  });
  const result = await request(`/api/security-events?${query}`, { token: tokenFor(operator) });

  assert.equal(result.response.status, 200);
  assert.equal(result.data.data.total, 1);
  assert.equal(result.data.data.items[0].user.fullName, owner.fullName);
  assert.equal(result.data.data.items[0].orderId, orderId);
  assert.equal(result.data.data.items[0].ipAddress, "192.0.2.1");
  assert.equal("otpHash" in result.data.data.items[0].metadata, false);
  assert.equal("accessToken" in result.data.data.items[0].metadata.details, false);
  assert.equal(JSON.stringify(result.data).includes("must-not-be-returned"), false);
  assert.equal(JSON.stringify(result.data).includes("must-also-be-hidden"), false);

  const invalidFilter = await request(`/api/security-events?userId=not-a-uuid`, {
    token: tokenFor(operator),
  });
  assert.equal(invalidFilter.response.status, 400);

  const unmatched = await request(`/api/security-events?ipAddress=203.0.113.8`, {
    token: tokenFor(operator),
  });
  assert.equal(unmatched.response.status, 200);
  assert.equal(unmatched.data.data.total, 0);

  const forbidden = await request("/api/security-events", { token: tokenFor(owner) });
  assert.equal(forbidden.response.status, 403);
});

test("escrow monitoring is read-only and the beneficiary catalog hides unverified products", async () => {
  const escrow = await request("/api/ops/escrow-summary", { token: tokenFor(operator) });
  assert.equal(escrow.response.status, 200);
  assert.equal(escrow.data.data.totalEscrowCommitted, "87.50");
  assert.equal(escrow.data.data.totalEscrowCleared, "12.50");
  assert.equal(escrow.data.data.totalPendingHandshake, "87.50");

  const catalog = await request("/api/products", { token: tokenFor(owner) });
  assert.equal(catalog.response.status, 200);
  assert.deepEqual(catalog.data.data.items.map((item) => item.name), ["Verified item"]);

  const supplierDenied = await request("/api/products", { token: tokenFor(supplierUser) });
  assert.equal(supplierDenied.response.status, 403);
});
