const { z } = require("zod");
const { PUBLIC_REGISTRATION_ROLES } = require("../constants/roles");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().regex(emailPattern).max(254),
  phoneNumber: z.string().trim().regex(phonePattern).max(16),
  password: z.string().min(8).max(128),
  role: z.enum(PUBLIC_REGISTRATION_ROLES),
}).strict();

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
}).strict();

module.exports = { loginSchema, registrationSchema };
