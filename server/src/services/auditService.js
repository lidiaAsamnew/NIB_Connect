async function recordAuditLog(prisma, {
  actorId = null,
  action,
  entityType,
  entityId = null,
  metadata = null,
}) {
  const data = { actorId, action, entityType, entityId };
  if (metadata !== null) {
    data.metadata = metadata;
  }
  return prisma.auditLog.create({
    data,
  });
}

module.exports = { recordAuditLog };
