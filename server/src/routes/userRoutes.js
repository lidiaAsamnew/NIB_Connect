const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");

function createUserRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate({ prisma, jwtSecret }));

  router.get("/me", (req, res) => {
    res.json({ success: true, data: req.user });
  });

  return router;
}

module.exports = { createUserRouter };
