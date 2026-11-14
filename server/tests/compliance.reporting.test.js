
import "dotenv/config";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.js";

const secret = process.env.JWT_SECRET || "default_jwt_secret_dev";

const { default: app } = await import("../src/app.js");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/compliance`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  await prisma.$disconnect();
});

function makeToken(role) {
  return jwt.sign(
    { id: "week2-test-user", role },
    secret,
    { expiresIn: "5m" }
  );
}

async function request(path, role) {
  const headers = {};
  if (role) headers.Authorization = `Bearer ${makeToken(role)}`;

  return fetch(`${baseUrl}${path}`, { headers });
}

test("unauthenticated request is rejected with 401", async () => {
  const response = await request("/summary");
  assert.equal(response.status, 401);
});

test("invalid token is rejected with 401", async () => {
  const response = await fetch(`${baseUrl}/summary`, {
    headers: { Authorization: "Bearer invalid-token" },
  });
  assert.equal(response.status, 401);
});

test("Supplier role is rejected with 403", async () => {
  const response = await request("/summary", "SUPPLIER");
  assert.equal(response.status, 403);
});

test("Startup role is rejected with 403", async () => {
  const response = await request("/summary", "STARTUP");
  assert.equal(response.status, 403);
});

test("EU compliance officer can access summary", async () => {
  const response = await request("/summary", "EU_COMPLIANCE_OFFICER");
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(body.data);
  assert.ok("startups" in body.data);
  assert.ok("suppliers" in body.data);
  assert.ok("orders" in body.data);
  assert.ok("impact" in body.data);
});

test("EU compliance officer receives weekly allocation array", async () => {
  const response = await request(
    "/weekly-allocation-stream",
    "EU_COMPLIANCE_OFFICER"
  );
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

test("EU compliance officer receives sector report names", async () => {
  const response = await request("/sector-report", "EU_COMPLIANCE_OFFICER");
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));

  for (const item of body.data) {
    assert.ok(item.sector);
  }
});

test("EU compliance officer receives region report names", async () => {
  const response = await request("/region-report", "EU_COMPLIANCE_OFFICER");
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));

  for (const item of body.data) {
    assert.ok(item.region);
  }
});
