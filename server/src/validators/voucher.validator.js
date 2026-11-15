const { z } = require("zod");

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const createVoucherSchema = z.object({
  recipientUserId: z.string().uuid(),
  amount: z.coerce.number()
    .positive()
    .max(1000000000)
    .refine((amount) => Number(amount.toFixed(2)) === amount, "Amount can have at most two decimal places."),
}).strict();

module.exports = { createVoucherSchema, paginationSchema };
