require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { createApp } = require("./src/app");
const {
  notifyExpiringVouchers,
  notifyPendingSupplierVerifications,
  notifyStaleHandshakeOrders,
} = require("./src/services/notificationService");

const prisma = new PrismaClient();
const app = createApp({ prisma });
const port = Number(process.env.PORT || 3000);
const handshakePendingMinutes = Number(process.env.HANDSHAKE_PENDING_ALERT_MINUTES || 60);
if (!Number.isSafeInteger(handshakePendingMinutes) || handshakePendingMinutes < 1) {
  throw new Error("HANDSHAKE_PENDING_ALERT_MINUTES must be a positive whole number.");
}

async function checkPendingHandshakeOrders() {
  try {
    await notifyStaleHandshakeOrders(prisma, handshakePendingMinutes);
  } catch (error) {
    console.error("Unable to create pending-handshake operator notifications:", error);
  }
}

async function checkOperationalAlerts() {
  try {
    await Promise.all([
      notifyPendingSupplierVerifications(prisma),
      notifyExpiringVouchers(prisma),
    ]);
  } catch (error) {
    console.error("Unable to create scheduled operator notifications:", error);
  }
}

const server = app.listen(port, () => {
  console.log(`NIB-Connect API running on port ${port}`);
  void checkPendingHandshakeOrders();
  void checkOperationalAlerts();
});
const handshakeAlertTimer = setInterval(checkPendingHandshakeOrders, 5 * 60 * 1000);
handshakeAlertTimer.unref();
const operationalAlertTimer = setInterval(checkOperationalAlerts, 30 * 60 * 1000);
operationalAlertTimer.unref();

async function shutdown() {
  clearInterval(handshakeAlertTimer);
  clearInterval(operationalAlertTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
