const { notifySecurityEvent } = require("./notificationService");

async function recordSecurityEvent(prisma, {
  userId = null,
  eventType,
  message,
  metadata = null,
}) {
  const data = { userId, eventType, message };
  if (metadata !== null) {
    data.metadata = metadata;
  }
  const event = await prisma.securityEvent.create({
    data,
  });
  await notifySecurityEvent(prisma, eventType);
  return event;
}

module.exports = { recordSecurityEvent };
