const { z } = require("zod");

const notificationQuerySchema = z.object({
  type: z.string().trim().min(1).max(64).optional(),
  unreadOnly: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const notificationIdSchema = z.object({
  id: z.string().uuid(),
}).strict();

module.exports = { notificationIdSchema, notificationQuerySchema };
