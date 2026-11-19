import type { BookingInput } from "./types";
import { getService, TIME_SLOTS } from "./data";

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  value?: BookingInput;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+][0-9\- ()]{4,19}$/;

function isValidCalendarDate(s: string): boolean {
  // DATE_RE already checks the shape; this rejects 2024-13-40 etc.
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function validateBooking(body: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.serviceId !== "string" || !getService(b.serviceId)) {
    errors.serviceId = "Please choose a valid service.";
  }

  const date = typeof b.date === "string" ? b.date : "";
  if (!date || !DATE_RE.test(date) || !isValidCalendarDate(date)) {
    errors.date = "Please provide a valid date (YYYY-MM-DD).";
  } else if (date < todayStr()) {
    errors.date = "Date cannot be in the past.";
  }

  const time = typeof b.time === "string" ? b.time : "";
  if (!TIME_SLOTS.includes(time)) {
    errors.time = "Please choose a valid time slot.";
  }

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name.length < 2 || name.length > 60) {
    errors.name = "Please enter your full name.";
  }

  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  if (!PHONE_RE.test(phone)) {
    errors.phone = "Please enter a valid contact number.";
  }

  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const vehicle = typeof b.vehicle === "string" ? b.vehicle.trim() : "";
  if (vehicle.length < 2 || vehicle.length > 100) {
    errors.vehicle = "Please tell us the vehicle.";
  }

  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  if (notes.length > 500) {
    errors.notes = "Notes must be 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: {},
    value: { serviceId: b.serviceId as string, date, time, name, phone, email, vehicle, notes },
  };
}
