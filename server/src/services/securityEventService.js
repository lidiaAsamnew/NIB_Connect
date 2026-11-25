const { notifySecurityEvent } = require("./notificationService");
const { redactSensitiveMetadata } = require("../utils/securityMetadata");

async function recordSecurityEvent(prisma, {
  userId = null,
  orderId = null,
  ipAddress = null,
  eventType,
  message,
  metadata = null,
}) {
  const data = { userId, eventType, message };
  const relatedOrderId = orderId || (typeof metadata?.orderId === "string" ? metadata.orderId : null);
  const sourceIpAddress = ipAddress || (typeof metadata?.ipAddress === "string" ? metadata.ipAddress : null);
  if (relatedOrderId) data.orderId = relatedOrderId;
  if (sourceIpAddress) data.ipAddress = sourceIpAddress;
  if (metadata !== null) {
    data.metadata = redactSensitiveMetadata(metadata);
  }
  const event = await prisma.securityEvent.create({
    data,
  });
  await notifySecurityEvent(prisma, eventType);
  return event;
}

module.exports = { recordSecurityEvent };
