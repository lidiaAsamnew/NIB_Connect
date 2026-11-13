const { verifyToken } = require("../utils/jwt");

function authenticate({ prisma, jwtSecret }) {
  return async (req, res, next) => {
    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid.",
      });
    }

    let decoded;
    try {
      decoded = verifyToken(match[1], jwtSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid.",
      });
    }

    if (!decoded || typeof decoded.sub !== "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid.",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Authentication token is missing or invalid.",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { authenticate };
