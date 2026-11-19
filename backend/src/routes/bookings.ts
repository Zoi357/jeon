import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { validateBooking } from "../validate";
import { addBooking, BookingError, readBookings } from "../store";

const router = Router();

// Create a booking (public).
router.post("/bookings", async (req: Request, res: Response, next: NextFunction) => {
  const result = validateBooking(req.body);
  if (!result.ok) {
    return res.status(400).json({
      error: "Please check the highlighted fields and try again.",
      fields: result.errors,
    });
  }

  try {
    const booking = await addBooking(result.value!);
    return res.status(201).json(booking);
  } catch (err) {
    if (err instanceof BookingError) {
      // 409 Conflict: slot already taken or similar.
      return res.status(409).json({ error: err.message, fields: err.fields });
    }
    return next(err);
  }
});

// List all bookings (admin only — protected by a shared secret).
router.get("/bookings", async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-admin-token"];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected === "change-me" || token !== expected) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  try {
    const bookings = await readBookings();
    return res.json(bookings);
  } catch (err) {
    return next(err);
  }
});

export default router;
