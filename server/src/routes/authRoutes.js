const bcrypt = require("bcryptjs");
const express = require("express");
const { PUBLIC_REGISTRATION_ROLES } = require("../constants/roles");
const { signToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;
const dummyPasswordHash = bcrypt.hash("unavailable-user-password", SALT_ROUNDS);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;
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

  router.post("/register", async (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid registration details.",
      });
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const password = body.password;
    const role = body.role;

    if (
      fullName.length < 2 ||
      !emailPattern.test(email) ||
      !phonePattern.test(phoneNumber) ||
      typeof password !== "string" ||
      password.length < 8 ||
      !PUBLIC_REGISTRATION_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name, email, phone number, password, and public role.",
      });
    }

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await prisma.user.create({
        data: { fullName, email, phoneNumber, passwordHash, role },
        select: publicUserFields,
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

  router.post("/login", async (req, res, next) => {
    const identifier = typeof req.body?.identifier === "string" ? req.body.identifier.trim() : "";
    const password = req.body?.password;

    if (!identifier || typeof password !== "string" || password.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

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
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }

      const accessToken = signToken(user, jwtSecret, jwtExpiresIn);
      const { passwordHash: omitted, ...safeUser } = user;
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
