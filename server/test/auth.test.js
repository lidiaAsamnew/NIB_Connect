const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");

const jwtSecret = "test-only-secret-that-is-long-enough-to-use-safely";
const password = "StrongPass123!";
const users = new Map();
const auditLogs = [];
const securityEvents = [];
const vouchers = [];
let server;
let baseUrl;

const prisma = {
  user: {
    async create({ data, select }) {
      if ([...users.values()].some((user) =>
        user.email === data.email || user.phoneNumber === data.phoneNumber
      )) {
        const error = new Error("Unique constraint failed");
        error.code = "P2002";
        throw error;
      }
      const user = {
        id: randomUUID(),
        ...data,
        isActive: true,
        createdAt: new Date(),
      };
      users.set(user.id, user);
      return Object.fromEntries(Object.keys(select).map((field) => [field, user[field]]));
    },
    async findUnique({ where, select }) {
      const user = users.get(where.id);
      if (!user || !select) return user || null;
      return Object.fromEntries(Object.keys(select).map((field) => [field, user[field]]));
    },
    async findFirst({ where }) {
      const [email, phoneNumber] = where.OR;
      return [...users.values()].find((user) =>
        user.email === email.email || user.phoneNumber === phoneNumber.phoneNumber
      ) || null;
    },
  },
  auditLog: {
    async create({ data }) {
      const item = { id: randomUUID(), ...data, createdAt: new Date() };
      auditLogs.push(item);
      return item;
    },
    async findMany({ where = {}, skip = 0, take = 20 }) {
      return auditLogs
        .filter((item) => matchesWhere(item, where))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(skip, skip + take);
    },
    async count({ where = {} } = {}) {
      return auditLogs.filter((item) => matchesWhere(item, where)).length;
    },
    async findUnique({ where }) {
      return auditLogs.find((item) => item.id === where.id) || null;
    },
  },
  securityEvent: {
    async create({ data }) {
      const item = { id: randomUUID(), ...data, createdAt: new Date() };
      securityEvents.push(item);
      return item;
    },
    async findMany({ where = {}, skip = 0, take = 20 }) {
      return securityEvents
        .filter((item) => matchesWhere(item, where))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(skip, skip + take);
    },
    async count({ where = {} } = {}) {
      return securityEvents.filter((item) => matchesWhere(item, where)).length;
    },
  },
  voucher: {
    async create({ data }) {
      const item = { id: randomUUID(), ...data, createdAt: new Date() };
      vouchers.push(item);
      return item;
    },
    async findMany({ where = {}, skip = 0, take = 20 }) {
      return vouchers
        .filter((item) => matchesWhere(item, where))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(skip, skip + take);
    },
    async count({ where = {} } = {}) {
      return vouchers.filter((item) => matchesWhere(item, where)).length;
    },
    async groupBy() {
      const groups = new Map();
      for (const voucher of vouchers) {
        const group = groups.get(voucher.status) || { amount: 0, count: 0 };
        group.amount += voucher.amount;
        group.count += 1;
        groups.set(voucher.status, group);
      }
      return [...groups.entries()].map(([status, group]) => ({
        status,
        _sum: { amount: group.amount },
        _count: { _all: group.count },
      }));
    },
  },
  async $transaction(callback) {
    return callback(prisma);
  },
};

function matchesWhere(item, where) {
  for (const [key, expected] of Object.entries(where)) {
    if (key === "createdAt") {
      if (expected.gte && item.createdAt < expected.gte) return false;
      if (expected.lt && item.createdAt >= expected.lt) return false;
    } else if (item[key] !== expected) {
      return false;
    }
  }
  return true;
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
  users.clear();
  auditLogs.length = 0;
  securityEvents.length = 0;
  vouchers.length = 0;
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

function registration(email, phoneNumber = "+251911000001") {
  return {
    fullName: "Loza Yonas",
    email,
    phoneNumber,
    password,
    role: "WOMEN_STARTUP_OWNER",
  };
}

test("registration validates input, hashes passwords, and rejects duplicate identities", async () => {
  const invalid = await request("/api/auth/register", {
    method: "POST",
    body: { ...registration("not-an-email"), role: "NIB_SYSTEM_OPERATOR" },
  });
  assert.equal(invalid.response.status, 400);

  const registered = await request("/api/auth/register", {
    method: "POST",
    body: registration("LOZA@example.com"),
  });
  assert.equal(registered.response.status, 201);
  assert.equal(registered.data.data.email, "loza@example.com");
  assert.equal("passwordHash" in registered.data.data, false);
  assert.equal(auditLogs.some((item) => item.action === "USER_REGISTERED"), true);

  const privilegedRole = await request("/api/auth/register", {
    method: "POST",
    body: { ...registration("operator@example.com", "+251911000003"), role: "NIB_SYSTEM_OPERATOR" },
  });
  assert.equal(privilegedRole.response.status, 400);

  const storedUser = [...users.values()][0];
  assert.notEqual(storedUser.passwordHash, password);
  assert.equal(await bcrypt.compare(password, storedUser.passwordHash), true);

  const duplicate = await request("/api/auth/register", {
    method: "POST",
    body: registration("loza@example.com", "+251911000002"),
  });
  assert.equal(duplicate.response.status, 409);
});

test("login accepts email and phone, returns a token, and uses a generic failure", async () => {
  const emailLogin = await request("/api/auth/login", {
    method: "POST",
    body: { identifier: "LOZA@example.com", password },
  });
  assert.equal(emailLogin.response.status, 200);
  assert.equal(typeof emailLogin.data.data.accessToken, "string");
  assert.equal("passwordHash" in emailLogin.data.data.user, false);

  const phoneLogin = await request("/api/auth/login", {
    method: "POST",
    body: { identifier: "+251911000001", password },
  });
  assert.equal(phoneLogin.response.status, 200);

  const invalid = await request("/api/auth/login", {
    method: "POST",
    body: { identifier: "unknown@example.com", password: "wrong-password" },
  });
  assert.equal(invalid.response.status, 401);
  assert.equal(invalid.data.message, "Invalid credentials.");
  assert.equal(auditLogs.some((item) => item.action === "USER_LOGIN_SUCCESS"), true);
  assert.equal(auditLogs.some((item) => item.action === "USER_LOGIN_FAILURE"), true);
  assert.equal(securityEvents.some((item) => item.eventType === "LOGIN_FAILED"), true);
  const serializedEvents = JSON.stringify({ auditLogs, securityEvents });
  assert.equal(serializedEvents.includes("unknown@example.com"), false);
  assert.equal(serializedEvents.includes(password), false);
});

test("current-user route requires a valid token and returns a safe profile", async () => {
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { identifier: "loza@example.com", password },
  });

  const missing = await request("/api/users/me");
  assert.equal(missing.response.status, 401);
  assert.equal(
    securityEvents.some((item) => item.eventType === "AUTHENTICATION_FAILED"),
    true,
  );

  const invalid = await request("/api/users/me", { token: "not-a-valid-token" });
  assert.equal(invalid.response.status, 401);

  const account = [...users.values()][0];
  const expiredToken = jwt.sign(
    { role: account.role, email: account.email },
    jwtSecret,
    { subject: account.id, expiresIn: -1 },
  );
  const expired = await request("/api/users/me", { token: expiredToken });
  assert.equal(expired.response.status, 401);

  const profile = await request("/api/users/me", { token: login.data.data.accessToken });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.data.data.email, "loza@example.com");
  assert.equal(profile.data.data.isActive, true);
  assert.equal("passwordHash" in profile.data.data, false);

  account.isActive = false;
  const deactivated = await request("/api/users/me", { token: login.data.data.accessToken });
  assert.equal(deactivated.response.status, 401);
  account.isActive = true;
});

test("role guard blocks a logged-in user with the wrong role", async () => {
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { identifier: "loza@example.com", password },
  });
  const denied = await request("/api/operator/access-check", {
    token: login.data.data.accessToken,
  });
  assert.equal(denied.response.status, 403);
  assert.equal(
    denied.data.message,
    "You do not have permission to perform this action.",
  );
  assert.equal(
    securityEvents.some((item) => item.eventType === "AUTHORIZATION_DENIED"),
    true,
  );
});

function seedUser(role, email, phoneNumber) {
  const user = {
    id: randomUUID(),
    fullName: "Test User",
    email,
    phoneNumber,
    passwordHash: "not-used",
    role,
    isActive: true,
    createdAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

function tokenFor(user) {
  return jwt.sign({ role: user.role, email: user.email }, jwtSecret, { subject: user.id });
}

test("audit and security records are restricted to operators and filters are validated", async () => {
  const operator = seedUser("NIB_SYSTEM_OPERATOR", "operator@example.com", "+251911000010");
  const owner = seedUser("WOMEN_STARTUP_OWNER", "owner@example.com", "+251911000011");
  const operatorToken = tokenFor(operator);

  const forbidden = await request("/api/audit-logs", { token: tokenFor(owner) });
  assert.equal(forbidden.response.status, 403);

  const invalidFilter = await request("/api/audit-logs?page=0", { token: operatorToken });
  assert.equal(invalidFilter.response.status, 400);
  assert.equal(invalidFilter.data.message, "Validation failed.");

  const logs = await request("/api/audit-logs?limit=5", { token: operatorToken });
  assert.equal(logs.response.status, 200);
  assert.ok(logs.data.data.total > 0);

  const auditId = logs.data.data.items[0].id;
  const deniedDetail = await request(`/api/audit-logs/${auditId}`, { token: tokenFor(owner) });
  assert.equal(deniedDetail.response.status, 403);
  const denialEvents = securityEvents.filter((item) => item.eventType === "AUTHORIZATION_DENIED");
  assert.equal(JSON.stringify(denialEvents[denialEvents.length - 1]).includes(auditId), false);

  const detail = await request(`/api/audit-logs/${auditId}`, { token: operatorToken });
  assert.equal(detail.response.status, 200);

  const events = await request("/api/security-events?eventType=AUTHORIZATION_DENIED", {
    token: operatorToken,
  });
  assert.equal(events.response.status, 200);
  assert.ok(events.data.data.items.length > 0);
});

test("voucher access is role-limited and owner history is database-scoped", async () => {
  const operator = seedUser("NIB_SYSTEM_OPERATOR", "voucher-operator@example.com", "+251911000020");
  const owner = seedUser("WOMEN_STARTUP_OWNER", "voucher-owner@example.com", "+251911000021");
  const otherOwner = seedUser("WOMEN_STARTUP_OWNER", "other-owner@example.com", "+251911000022");
  const euOfficer = seedUser("EU_COMPLIANCE_OFFICER", "eu@example.com", "+251911000023");
  const supplier = seedUser("TIER1_SUPPLIER", "supplier@example.com", "+251911000024");

  const created = await request("/api/vouchers", {
    method: "POST",
    token: tokenFor(operator),
    body: { recipientUserId: owner.id, amount: 250.5 },
  });
  assert.equal(created.response.status, 201);

  const invalidAmount = await request("/api/vouchers", {
    method: "POST",
    token: tokenFor(operator),
    body: { recipientUserId: owner.id, amount: 250.555 },
  });
  assert.equal(invalidAmount.response.status, 400);
  assert.equal(vouchers.length, 1);

  const ownerHistory = await request("/api/vouchers/mine", { token: tokenFor(owner) });
  assert.equal(ownerHistory.response.status, 200);
  assert.equal(ownerHistory.data.data.total, 1);

  const otherHistory = await request("/api/vouchers/mine", { token: tokenFor(otherOwner) });
  assert.equal(otherHistory.response.status, 200);
  assert.equal(otherHistory.data.data.total, 0);

  const supplierDenied = await request("/api/vouchers/mine", { token: tokenFor(supplier) });
  assert.equal(supplierDenied.response.status, 403);

  const euSummary = await request("/api/vouchers/summary", { token: tokenFor(euOfficer) });
  assert.equal(euSummary.response.status, 200);
  assert.equal(euSummary.data.data.totals[0]._count._all, 1);
});

test("authentication rate limiting records a security event", async () => {
  let limitedResponse;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await request("/api/auth/register", {
      method: "POST",
      body: {},
    });
    if (result.response.status === 429) {
      limitedResponse = result.response;
      break;
    }
    assert.equal(result.response.status, 400);
  }

  assert.equal(limitedResponse.status, 429);
  assert.equal(
    securityEvents.some((item) => item.eventType === "AUTH_RATE_LIMITED"),
    true,
  );
});
