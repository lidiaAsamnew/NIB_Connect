import { Router } from "express";
import { getMonitorSummary } from "../controllers/escrowMonitorController.js";

const router = Router();

// TODO: protect with Student 4's login and role check (NIB_SYSTEM_OPERATOR) once it is merged
router.get("/monitor-summary", getMonitorSummary);

export default router;