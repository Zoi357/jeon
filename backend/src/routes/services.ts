import { Router } from "express";
import { SERVICES, TIME_SLOTS } from "../data";

const router = Router();

// GET /api/services → service catalogue + available time slots.
router.get("/services", (_req, res) => {
  res.json({ services: SERVICES, timeSlots: TIME_SLOTS });
});

export default router;
