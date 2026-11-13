const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");

const jwtSecret = "test-only-secret-that-is-long-enough-to-use-safely";
const password = "StrongPass123!";
const users = new Map();
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
};

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
});

test("current-user route requires a valid token and returns a safe profile", async () => {
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { identifier: "loza@example.com", password },
  });

  const missing = await request("/api/users/me");
  assert.equal(missing.response.status, 401);

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
});
