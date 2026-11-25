const { z } = require("zod");
const { USER_ROLES } = require("../constants/roles");

const userListSchema = z.object({
  search: z.string().trim().min(1).max(254).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(["active", "deactivated"]).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const userIdSchema = z.object({
  id: z.string().uuid(),
}).strict();

module.exports = { userIdSchema, userListSchema };
