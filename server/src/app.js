import express from "express";
import cors from "cors";
import escrowRoutes from "./routes/escrowRoutes.js";
import complianceRoutes from "./routes/complianceRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/escrow", escrowRoutes);
app.use("/api/compliance", complianceRoutes);

// Error handler: any thrown error ends up here
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err.errors?.length ? { errors: err.errors } : {}),
  });
});

export default app;