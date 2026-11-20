import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { Booking, BookingInput } from "./types";
import { getService, TIME_SLOTS } from "./data";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");

// SSE subscribers: map of response objects listening for slot changes.
// Key = arbitrary subscriber id.
const sseClients = new Map<string, NodeJS.WritableStream>();

export function addSseClient(id: string, stream: NodeJS.WritableStream) {
  sseClients.set(id, stream);
}
export function removeSseClient(id: string) {
  sseClients.delete(id);
}

function broadcastSlotUpdate(date: string, slots: SlotStatus[]) {
  const payload = JSON.stringify({ date, slots });
  const msg = `data: ${payload}\n\n`;
  for (const stream of sseClients.values()) {
    try { stream.write(msg); } catch { /* client disconnected */ }
  }
}

export type SlotStatus = {
  time: string;
  status: "available" | "pending" | "confirmed";
};

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

async function writeBookings(bookings: Booking[]): Promise<void> {
  await ensureFile();
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(bookings, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Returns the status of every time slot for a given date.
export async function getSlotsForDate(
  date: string,
  allSlots: string[],
): Promise<SlotStatus[]> {
  const bookings = await readBookings();
  const dayBookings = bookings.filter(
    (b) => b.date === date && b.status !== "cancelled",
  );

  return allSlots.map((time) => {
    const match = dayBookings.find((b) => b.time === time);
    if (!match) return { time, status: "available" };
    if (match.status === "confirmed") return { time, status: "confirmed" };
    return { time, status: "pending" };
  });
}

export async function addBooking(input: BookingInput): Promise<Booking> {
  const service = getService(input.serviceId);
  if (!service) {
    throw new BookingError("Unknown service.", {
      serviceId: "Unknown service selected.",
    });
  }

  const bookings = await readBookings();

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
    name: input.name,
    phone: input.phone,
    email: input.email,
    vehicle: input.vehicle,
    notes: input.notes ?? "",
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  await writeBookings(bookings);

  // Broadcast updated slot statuses to all SSE listeners for this date.
  const updated = await getSlotsForDate(input.date, TIME_SLOTS);
  broadcastSlotUpdate(input.date, updated);

  return booking;
}

export async function updateBookingStatus(
  id: string,
  status: Booking["status"],
): Promise<Booking | null> {
  const bookings = await readBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx].status = status;
  await writeBookings(bookings);

  const booking = bookings[idx];
  const updated = await getSlotsForDate(booking.date, TIME_SLOTS);
  broadcastSlotUpdate(booking.date, updated);

  return booking;
}

export async function getStats(): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  today: number;
}> {
  const bookings = await readBookings();
  const todayStr = new Date().toISOString().split("T")[0];
  return {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    today: bookings.filter((b) => b.date === todayStr && b.status !== "cancelled").length,
  };
}
