const bcrypt = require("bcryptjs");
const express = require("express");
const { validate } = require("../middlewares/validate");
const { recordAuditLog } = require("../services/auditService");
const { recordSecurityEvent } = require("../services/securityEventService");
const { loginSchema, registrationSchema } = require("../validators/auth.validator");
const { signToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;
const dummyPasswordHash = bcrypt.hash("unavailable-user-password", SALT_ROUNDS);
const publicUserFields = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true,
  isActive: true,
  createdAt: true,
};

function isDuplicateUserError(error) {
  return error && error.code === "P2002";
}

function createAuthRouter({ prisma, jwtSecret, jwtExpiresIn }) {
  const router = express.Router();

  router.post("/register", validate(registrationSchema), async (req, res, next) => {
    const { fullName, email, phoneNumber, password, role } = req.validatedBody;
    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: { fullName, email, phoneNumber, passwordHash, role },
          select: publicUserFields,
        });
        await recordAuditLog(transaction, {
          actorId: createdUser.id,
          action: "USER_REGISTERED",
          entityType: "USER",
          entityId: createdUser.id,
          metadata: { role: createdUser.role },
        });
        return createdUser;
      });
      return res.status(201).json({
        success: true,
        message: "Registration successful.",
        data: user,
      });
    } catch (error) {
      if (isDuplicateUserError(error)) {
        return res.status(409).json({
          success: false,
          message: "Email or phone number already registered.",
        });
      }
      return next(error);
    }
  });

  router.post("/login", validate(loginSchema), async (req, res, next) => {
    const { identifier, password } = req.validatedBody;
    try {
      const normalizedIdentifier = identifier.includes("@")
        ? identifier.toLowerCase()
        : identifier;
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedIdentifier },
            { phoneNumber: normalizedIdentifier },
          ],
        },
      });

      const passwordHash = user ? user.passwordHash : await dummyPasswordHash;
      const passwordMatches = await bcrypt.compare(password, passwordHash);
      if (!user || !user.isActive || !passwordMatches) {
        const reason = !user
          ? "unknown_user"
          : !user.isActive
            ? "inactive_account"
            : "invalid_password";
        await prisma.$transaction(async (transaction) => {
          await recordAuditLog(transaction, {
            actorId: user ? user.id : null,
            action: "USER_LOGIN_FAILURE",
            entityType: "USER",
            entityId: user ? user.id : null,
            metadata: { reason },
          });
          await recordSecurityEvent(transaction, {
            userId: user ? user.id : null,
            eventType: "LOGIN_FAILED",
            message: "A login attempt failed.",
            metadata: { reason },
          });
        });
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }

      const accessToken = signToken(user, jwtSecret, jwtExpiresIn);
      const { passwordHash: omitted, ...safeUser } = user;
      await recordAuditLog(prisma, {
        actorId: user.id,
        action: "USER_LOGIN_SUCCESS",
        entityType: "USER",
        entityId: user.id,
        metadata: { role: user.role },
      });
      return res.json({
        success: true,
        message: "Login successful.",
        data: { accessToken, user: safeUser },
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createAuthRouter };
