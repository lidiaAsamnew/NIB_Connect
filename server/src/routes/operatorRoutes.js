const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleGuard");

function createOperatorRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));
  router.get("/access-check", authorize("NIB_SYSTEM_OPERATOR"), (req, res) => {
    res.json({
      success: true,
      message: "NIB system operator access verified.",
      data: { id: req.user.id, role: req.user.role },
    });
  });
  return router;
}

module.exports = { createOperatorRouter };
