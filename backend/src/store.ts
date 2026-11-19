import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { Booking, BookingInput } from "./types";
import { getService } from "./data";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");

// Cheap, deterministic reference: JEON-XXXXXX (hex, uppercase). 3 bytes → 6 hex chars.
function makeReference(): string {
  return "JEON-" + randomBytes(3).toString("hex").toUpperCase();
}

export class BookingError extends Error {
  fields?: Record<string, string>;
  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.fields = fields;
  }
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function readBookings(): Promise<Booking[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

// Atomic write: temp file + rename, so a crash mid-write can't corrupt the store.
async function writeBookings(bookings: Booking[]): Promise<void> {
  await ensureFile();
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(bookings, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Note: read-modify-write is not safe under high concurrency.
// Fine for a single-bay workshop with low traffic; swap to a real DB to scale.
export async function addBooking(input: BookingInput): Promise<Booking> {
  const service = getService(input.serviceId);
  if (!service) {
    throw new BookingError("Unknown service.", { serviceId: "Unknown service selected." });
  }

  const bookings = await readBookings();

  // Prevent double-booking the same slot (single bay assumption).
  const clash = bookings.find(
    (b) =>
      b.date === input.date &&
      b.time === input.time &&
      b.status !== "cancelled",
  );
  if (clash) {
    throw new BookingError(
      "That time slot is already taken. Please choose another time.",
      { time: "This slot is already booked." },
    );
  }

  const booking: Booking = {
    id: randomBytes(8).toString("hex"),
    reference: makeReference(),
    status: "pending",
    serviceId: service.id,
    serviceName: service.name,
    date: input.date,
    time: input.time,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    vehicle: input.vehicle.trim(),
    notes: (input.notes ?? "").trim(),
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  await writeBookings(bookings);
  return booking;
}
