import express from "express";
import cors from "cors";
import escrowRoutes from "./routes/escrowRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import devRoutes from "./routes/devRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/escrow", escrowRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/orders", orderRoutes);

// TEMPORARY: dev helpers for the tester page. Remove when Student 4's login is merged.
app.use("/api/dev", devRoutes);

// Error handler: any thrown error ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

export default app;