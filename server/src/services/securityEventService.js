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
  return prisma.securityEvent.create({
    data,
  });
}

module.exports = { recordSecurityEvent };
