import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { readBookings, getStats, updateBookingStatus } from "../store";

const router = Router();

// ── POST /api/admin/login ─────────────────────────────────────────────────────
router.post("/admin/login", (req: Request, res: Response) => {
  const { username, password } = req.body as Record<string, unknown>;
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "changeme";

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  req.session!.adminLoggedIn = true;
  return res.json({ ok: true });
});

// ── POST /api/admin/logout ────────────────────────────────────────────────────
router.post("/admin/logout", (req: Request, res: Response) => {
  req.session?.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// ── GET /api/admin/me ─────────────────────────────────────────────────────────
router.get("/admin/me", (req: Request, res: Response) => {
  if (!req.session?.adminLoggedIn) {
    return res.status(401).json({ error: "Not logged in." });
  }
  return res.json({ loggedIn: true });
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get("/admin/stats", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.adminLoggedIn) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  try {
    const stats = await getStats();
    return res.json(stats);
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/admin/bookings ───────────────────────────────────────────────────
router.get("/admin/bookings", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.adminLoggedIn) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  try {
    const bookings = await readBookings();
    // Most recent first.
    bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.json(bookings);
  } catch (err) {
    return next(err);
  }
});

// ── PATCH /api/admin/bookings/:id ─────────────────────────────────────────────
router.patch("/admin/bookings/:id", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.adminLoggedIn) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const { status } = req.body as { status?: string };
  if (!["pending", "confirmed", "cancelled"].includes(status ?? "")) {
    return res.status(400).json({ error: "status must be pending | confirmed | cancelled." });
  }
  try {
    const updated = await updateBookingStatus(
      req.params.id,
      status as "pending" | "confirmed" | "cancelled",
    );
    if (!updated) return res.status(404).json({ error: "Booking not found." });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

export default router;
