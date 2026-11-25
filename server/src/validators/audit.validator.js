const { z } = require("zod");

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Expected a valid YYYY-MM-DD date.");

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const auditQuerySchema = z.object({
  action: z.string().trim().min(1).max(64).optional(),
  entityType: z.string().trim().min(1).max(64).optional(),
  entityId: z.string().trim().min(1).max(64).optional(),
  actor: z.string().trim().min(1).max(254).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  ...paginationFields,
}).strict().superRefine((query, context) => {
  if (query.from && query.to && query.from > query.to) {
    context.addIssue({
      code: "custom",
      path: ["from"],
      message: "'from' must be on or before 'to'.",
    });
  }
});

const securityEventQuerySchema = z.object({
  eventType: z.string().trim().min(1).max(64).optional(),
  userId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  ipAddress: z.string().trim().min(1).max(45).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  ...paginationFields,
}).strict().superRefine((query, context) => {
  if (query.from && query.to && query.from > query.to) {
    context.addIssue({
      code: "custom",
      path: ["from"],
      message: "'from' must be on or before 'to'.",
    });
  }
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

module.exports = { auditQuerySchema, idParamsSchema, securityEventQuerySchema };
