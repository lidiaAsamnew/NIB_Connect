import express from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const router = express.Router();

router.post("/login", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  const { identifier, password } = req.body;

  const expectedEmail = process.env.DEV_EU_EMAIL;
  const expectedPassword = process.env.DEV_EU_PASSWORD;

  if (!expectedEmail || !expectedPassword || !process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Development login is not configured",
    });
  }

  const emailMatches =
    typeof identifier === "string" &&
    identifier.trim().toLowerCase() === expectedEmail.trim().toLowerCase();

  const passwordMatches =
    typeof password === "string" &&
    Buffer.byteLength(password) === Buffer.byteLength(expectedPassword) &&
    crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(expectedPassword)
    );

  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const user = {
    id: "dev-eu-officer",
    fullName: "Development EU Officer",
    email: expectedEmail,
    phoneNumber: "",
    role: "EU_COMPLIANCE_OFFICER",
  };

  const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });

  return res.json({
    success: true,
    message: "Login successful.",
    data: { accessToken, user },
  });
});

export default router;
