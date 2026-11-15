const { z } = require("zod");

const voucherStatuses = [
  "ACTIVE",
  "ALLOCATED",
  "COMMITTED_TO_ORDER",
  "REDEEMED",
  "REDEEMED_AND_SETTLED",
  "EXPIRED",
  "CANCELLED",
];
const orderStatuses = [
  "PLACED",
  "DISPATCHED_IN_TRANSIT",
  "DELIVERED_PENDING_HANDSHAKE",
  "VERIFIED_AND_CLEARED",
  "CANCELLED",
];

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Date must be a valid YYYY-MM-DD value.");

const paginationFields = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

function withDateRange(schema) {
  return schema.refine(
    ({ from, to }) => !from || !to || from <= to,
    { path: ["to"], message: "to must be on or after from." },
  );
}

const supplierListSchema = z.object({
  status: z.enum(["verified", "unverified"]).optional(),
  search: z.string().trim().min(1).max(160).optional(),
  ...paginationFields,
}).strict();

const voucherListSchema = withDateRange(z.object({
  status: z.enum(voucherStatuses).optional(),
  startupId: z.string().uuid().optional(),
  expired: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  amountMin: z.coerce.number().finite().nonnegative().max(1000000000)
    .refine((value) => Number(value.toFixed(2)) === value, "Amount can have at most two decimal places.")
    .optional(),
  amountMax: z.coerce.number().finite().nonnegative().max(1000000000)
    .refine((value) => Number(value.toFixed(2)) === value, "Amount can have at most two decimal places.")
    .optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  ...paginationFields,
}).strict()).refine(
  ({ amountMin, amountMax }) => amountMin === undefined || amountMax === undefined || amountMin <= amountMax,
  { path: ["amountMax"], message: "amountMax must be greater than or equal to amountMin." },
);

const orderListSchema = withDateRange(z.object({
  status: z.enum(orderStatuses).optional(),
  supplierId: z.string().uuid().optional(),
  startupId: z.string().uuid().optional(),
  waybillCode: z.string().trim().min(1).max(191).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  ...paginationFields,
}).strict());

const supplierIdSchema = z.object({
  id: z.string().uuid(),
}).strict();

const verifySupplierSchema = z.object({
  remarks: z.string().trim().min(3).max(500),
}).strict();

const unverifySupplierSchema = z.object({
  remarks: z.string().trim().min(3).max(500).optional(),
}).strict();

const catalogQuerySchema = z.object({
  search: z.string().trim().min(1).max(160).optional(),
  ...paginationFields,
}).strict();

module.exports = {
  catalogQuerySchema,
  orderListSchema,
  supplierIdSchema,
  supplierListSchema,
  unverifySupplierSchema,
  verifySupplierSchema,
  voucherListSchema,
};
