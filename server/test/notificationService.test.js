const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { recordSecurityEvent } = require("../src/services/securityEventService");
const { notifyStaleHandshakeOrders } = require("../src/services/notificationService");

function notificationPrisma() {
  const operators = [
    { id: randomUUID() },
    { id: randomUUID() },
  ];
  const notifications = [];
  const securityEvents = [];
  const staleOrders = [{ id: randomUUID() }];
  return {
    operators,
    notifications,
    securityEvents,
    staleOrders,
    user: {
      async findMany() {
        return operators;
      },
    },
    notification: {
      async findFirst({ where }) {
        return notifications.find((item) => Object.entries(where).every(([key, value]) => {
          if (value && typeof value === "object" && "gte" in value) {
            return item[key] >= value.gte;
          }
          return item[key] === value;
        })) || null;
      },
      async create({ data }) {
        const item = { id: randomUUID(), ...data, createdAt: new Date() };
        notifications.push(item);
        return item;
      },
    },
    securityEvent: {
      async create({ data }) {
        const event = { id: randomUUID(), ...data, createdAt: new Date() };
        securityEvents.push(event);
        return event;
      },
      async count({ where }) {
        return securityEvents.filter((event) =>
          event.eventType === where.eventType &&
          event.createdAt >= where.createdAt.gte
        ).length;
      },
    },
    order: {
      async findMany() {
        return staleOrders;
      },
    },
  };
}

test("suspicious OTP events notify operators without copying secret metadata", async () => {
  const prisma = notificationPrisma();
  await recordSecurityEvent(prisma, {
    eventType: "SUSPICIOUS_OTP_ATTEMPT",
    message: "Suspicious handshake attempt.",
    ipAddress: "192.0.2.1",
    metadata: {
      orderId: randomUUID(),
      otpHash: "must-not-be-stored",
      details: { accessToken: "must-not-be-stored-either" },
    },
  });

  assert.equal(prisma.securityEvents.length, 1);
  assert.equal(prisma.securityEvents[0].orderId, prisma.securityEvents[0].metadata.orderId);
  assert.equal(prisma.securityEvents[0].ipAddress, "192.0.2.1");
  assert.equal("otpHash" in prisma.securityEvents[0].metadata, false);
  assert.equal("accessToken" in prisma.securityEvents[0].metadata.details, false);
  assert.equal(JSON.stringify(prisma.securityEvents[0]).includes("must-not-be-stored"), false);
  assert.equal(prisma.notifications.length, prisma.operators.length);
  assert.ok(prisma.notifications.every((item) => item.type === "SUSPICIOUS_OTP_ATTEMPT"));
});

test("repeated failed logins create one throttled operator alert", async () => {
  const prisma = notificationPrisma();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await recordSecurityEvent(prisma, {
      eventType: "LOGIN_FAILED",
      message: "A login attempt failed.",
    });
  }

  assert.equal(prisma.notifications.filter((item) => item.type === "FAILED_LOGIN_SPIKE").length, 2);
});

test("stale handshake notifications are deduplicated by order", async () => {
  const prisma = notificationPrisma();
  const firstCreated = await notifyStaleHandshakeOrders(prisma, 60);
  const secondCreated = await notifyStaleHandshakeOrders(prisma, 60);

  assert.equal(firstCreated, prisma.operators.length);
  assert.equal(secondCreated, 0);
  assert.equal(prisma.notifications.length, prisma.operators.length);
});
