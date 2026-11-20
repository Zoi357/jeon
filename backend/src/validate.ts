import type { BookingInput } from "./types";
import { getService, TIME_SLOTS } from "./data";

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  value?: BookingInput;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone: starts with + or digit, then digits/spaces/dashes/parens, 6–20 chars total.
const PHONE_RE = /^[0-9+][0-9\- ()]{4,19}$/;
// Allowed in name / vehicle / notes: letters, digits, spaces and common punctuation.
// Rejects control chars, angle brackets, quotes used for injection.
const SAFE_TEXT_RE = /^[a-zA-Z0-9\s.,'\-&#@():\/]+$/;

function strip(s: string): string {
  // Remove leading/trailing whitespace and collapse internal runs.
  return s.trim().replace(/\s{2,}/g, " ");
}

function isSafe(s: string): boolean {
  return SAFE_TEXT_RE.test(s);
}

function isValidCalendarDate(s: string): boolean {
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

  const date = typeof b.date === "string" ? b.date.trim() : "";
  if (!date || !DATE_RE.test(date) || !isValidCalendarDate(date)) {
    errors.date = "Please provide a valid date (YYYY-MM-DD).";
  } else if (date < todayStr()) {
    errors.date = "Date cannot be in the past.";
  }

  const time = typeof b.time === "string" ? b.time.trim() : "";
  if (!TIME_SLOTS.includes(time)) {
    errors.time = "Please choose a valid time slot.";
  }

  const rawName = typeof b.name === "string" ? strip(b.name) : "";
  if (rawName.length < 2 || rawName.length > 60) {
    errors.name = "Please enter your full name (2–60 characters).";
  } else if (!isSafe(rawName)) {
    errors.name = "Name contains invalid characters.";
  }

  const rawPhone = typeof b.phone === "string" ? b.phone.trim() : "";
  if (!PHONE_RE.test(rawPhone)) {
    errors.phone = "Please enter a valid contact number.";
  }

  const rawEmail = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(rawEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  const rawVehicle = typeof b.vehicle === "string" ? strip(b.vehicle) : "";
  if (rawVehicle.length < 2 || rawVehicle.length > 100) {
    errors.vehicle = "Please tell us the vehicle (2–100 characters).";
  } else if (!isSafe(rawVehicle)) {
    errors.vehicle = "Vehicle description contains invalid characters.";
  }

  const rawNotes = typeof b.notes === "string" ? strip(b.notes) : "";
  if (rawNotes.length > 500) {
    errors.notes = "Notes must be 500 characters or fewer.";
  } else if (rawNotes && !isSafe(rawNotes)) {
    errors.notes = "Notes contain invalid characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: {},
    value: {
      serviceId: b.serviceId as string,
      date,
      time,
      name: rawName,
      phone: rawPhone,
      email: rawEmail,
      vehicle: rawVehicle,
      notes: rawNotes,
    },
  };
}
