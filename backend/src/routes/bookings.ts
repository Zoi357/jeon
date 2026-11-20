import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { validateBooking } from "../validate";
import {
  addBooking,
  BookingError,
  readBookings,
  getSlotsForDate,
  addSseClient,
  removeSseClient,
} from "../store";
import { sendBookingConfirmation } from "../mailer";
import { TIME_SLOTS } from "../data";

const router = Router();

// ── GET /api/slots?date=YYYY-MM-DD ────────────────────────────────────────────
// Returns the booking status of every time slot for the given date.
router.get("/slots", async (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.query;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Provide a valid date query param (YYYY-MM-DD)." });
  }
  try {
    const slots = await getSlotsForDate(date, TIME_SLOTS);
    return res.json({ date, slots });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/slots/stream?date=YYYY-MM-DD ─────────────────────────────────────
// Server-Sent Events: pushes slot updates in real time whenever a booking is
// made or updated for the requested date.
router.get("/slots/stream", (req: Request, res: Response) => {
  const { date } = req.query;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).end("Provide a valid date query param (YYYY-MM-DD).");
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const id = Math.random().toString(36).slice(2);
  addSseClient(id, res);

  // Send current state immediately on connect.
  getSlotsForDate(date, TIME_SLOTS).then((slots) => {
    res.write(`data: ${JSON.stringify({ date, slots })}\n\n`);
  });

  // Keep-alive ping every 20 s.
  const ping = setInterval(() => res.write(": ping\n\n"), 20_000);

  req.on("close", () => {
    clearInterval(ping);
    removeSseClient(id);
  });
});

// ── POST /api/bookings ────────────────────────────────────────────────────────
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

    // Fire-and-forget email — don't fail the request if mail is misconfigured.
    sendBookingConfirmation(booking).catch((err) =>
      console.error("Email send failed:", err),
    );

    return res.status(201).json(booking);
  } catch (err) {
    if (err instanceof BookingError) {
      return res.status(409).json({ error: err.message, fields: err.fields });
    }
    return next(err);
  }
});

// ── GET /api/bookings (admin) ─────────────────────────────────────────────────
router.get("/bookings", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.adminLoggedIn) {
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
