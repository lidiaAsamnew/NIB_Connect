import express from "express";
import cors from "cors";
import escrowRoutes from "./routes/escrowRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { authenticate } from "./middleware/devAuth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

// TEMPORARY test route: shows who the server thinks you are
app.get("/api/dev/whoami", authenticate, (req, res) => {
  res.json({
    success: true,
    data: { id: req.user.id, fullName: req.user.fullName, role: req.user.role },
  });
});

app.use("/api/escrow", escrowRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/orders", orderRoutes);

// Error handler: any thrown error ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

export default app;