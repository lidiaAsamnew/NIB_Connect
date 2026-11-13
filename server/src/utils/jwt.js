const jwt = require("jsonwebtoken");

function signToken(user, secret, expiresIn = "1d") {
  if (!secret) {
    throw new Error("JWT_SECRET must be configured before signing tokens.");
  }

  return jwt.sign(
    { role: user.role, email: user.email },
    secret,
    { subject: user.id, expiresIn },
  );
}

function verifyToken(token, secret) {
  if (!secret) {
    throw new Error("JWT_SECRET must be configured before verifying tokens.");
  }
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
