const FAILED_LOGIN_WINDOW_MINUTES = 15;
const FAILED_LOGIN_ALERT_THRESHOLD = 5;
const FAILED_LOGIN_ALERT_COOLDOWN_MINUTES = 60;
const PENDING_SUPPLIER_ALERT_HOURS = 24;
const VOUCHER_EXPIRY_WARNING_DAYS = 7;

async function createOperatorNotifications(prisma, {
  title,
  message,
  type,
  link,
  relatedEntityId = null,
}) {
  const operators = await prisma.user.findMany({
    where: { role: "NIB_SYSTEM_OPERATOR", isActive: true },
    select: { id: true },
  });
  const created = [];

  for (const operator of operators) {
    if (relatedEntityId !== null) {
      const existing = await prisma.notification.findFirst({
        where: { userId: operator.id, type, relatedEntityId },
        select: { id: true },
      });
      if (existing) continue;
    }

    created.push(await prisma.notification.create({
      data: {
        userId: operator.id,
        title,
        message,
        type,
        link,
        relatedEntityId,
      },
    }));
  }

  return created;
}

async function notifyFailedLoginSpike(prisma) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000);
  const failureCount = await prisma.securityEvent.count({
    where: { eventType: "LOGIN_FAILED", createdAt: { gte: windowStart } },
  });
  if (failureCount < FAILED_LOGIN_ALERT_THRESHOLD) return;

  const cooldownStart = new Date(now.getTime() - FAILED_LOGIN_ALERT_COOLDOWN_MINUTES * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      type: "FAILED_LOGIN_SPIKE",
      createdAt: { gte: cooldownStart },
    },
    select: { id: true },
  });
  if (existing) return;

  await createOperatorNotifications(prisma, {
    title: "Failed login spike",
    message: `${failureCount} failed login attempts were recorded in the last ${FAILED_LOGIN_WINDOW_MINUTES} minutes.`,
    type: "FAILED_LOGIN_SPIKE",
    link: "/operator/dashboard",
  });
}

async function notifyStaleHandshakeOrders(prisma, thresholdMinutes = 60) {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED_PENDING_HANDSHAKE",
      OR: [
        { arrivedAt: { lte: cutoff } },
        { arrivedAt: null, createdAt: { lte: cutoff } },
      ],
    },
    select: { id: true },
  });

  let createdCount = 0;
  for (const order of orders) {
    const notifications = await createOperatorNotifications(prisma, {
      title: "Order awaiting delivery handshake",
      message: `Order ${order.id} has been waiting for beneficiary confirmation beyond the configured threshold.`,
      type: "ORDER_PENDING_HANDSHAKE_TOO_LONG",
      link: "/operator/orders",
      relatedEntityId: order.id,
    });
    createdCount += notifications.length;
  }
  return createdCount;
}

async function notifyPendingSupplierVerifications(prisma) {
  const cutoff = new Date(Date.now() - PENDING_SUPPLIER_ALERT_HOURS * 60 * 60 * 1000);
  const suppliers = await prisma.supplierProfile.findMany({
    where: { isVerified: false, createdAt: { lte: cutoff } },
    select: { id: true, companyName: true },
  });

  let createdCount = 0;
  for (const supplier of suppliers) {
    const notifications = await createOperatorNotifications(prisma, {
      title: "Supplier verification is overdue",
      message: `Supplier ${supplier.companyName} has been waiting for verification for more than ${PENDING_SUPPLIER_ALERT_HOURS} hours.`,
      type: "SUPPLIER_PENDING_VERIFICATION",
      link: "/operator/suppliers",
      relatedEntityId: supplier.id,
    });
    createdCount += notifications.length;
  }
  return createdCount;
}

async function notifyExpiringVouchers(prisma) {
  const now = new Date();
  const warningEnd = new Date(now.getTime() + VOUCHER_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const vouchers = await prisma.voucher.findMany({
    where: {
      status: { in: ["ACTIVE", "ALLOCATED"] },
      expiresAt: { gte: now, lte: warningEnd },
    },
    select: { id: true },
  });

  let createdCount = 0;
  for (const voucher of vouchers) {
    const notifications = await createOperatorNotifications(prisma, {
      title: "Voucher expiring soon",
      message: `Voucher ${voucher.id} is due to expire within ${VOUCHER_EXPIRY_WARNING_DAYS} days.`,
      type: "VOUCHER_EXPIRING_SOON",
      link: "/operator/vouchers",
      relatedEntityId: voucher.id,
    });
    createdCount += notifications.length;
  }
  return createdCount;
}

async function notifySecurityEvent(prisma, eventType) {
  if (eventType === "LOGIN_FAILED") {
    await notifyFailedLoginSpike(prisma);
    return;
  }

  if (eventType === "SUSPICIOUS_OTP_ATTEMPT" || eventType === "OTP_BRUTE_FORCE_SUSPECTED") {
    await createOperatorNotifications(prisma, {
      title: "Suspicious delivery handshake activity",
      message: "A suspicious delivery handshake attempt was recorded and needs review.",
      type: eventType,
      link: "/operator/dashboard",
    });
  }
}

module.exports = {
  createOperatorNotifications,
  notifyExpiringVouchers,
  notifyPendingSupplierVerifications,
  notifySecurityEvent,
  notifyStaleHandshakeOrders,
};
