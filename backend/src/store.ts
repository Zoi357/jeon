import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import {
  createPool,
  type Pool,
  type RowDataPacket,
} from "mysql2/promise";
import type { Booking, BookingInput } from "./types";
import { getService, TIME_SLOTS } from "./data";

const DATA_FILE = path.join(process.cwd(), "data", "bookings.json");
const MIGRATION_KEY = "legacy-json-bookings-v1";

let database: Pool | undefined;

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

interface BookingRow extends RowDataPacket {
  id: string;
  reference: string;
  status: Booking["status"];
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  notes: string;
  createdAt: string;
}

function getDatabase(): Pool {
  if (!database) {
    throw new Error("The MySQL booking store has not been initialized.");
  }
  return database;
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function isLegacyBooking(value: unknown): value is Booking {
  if (typeof value !== "object" || value === null) return false;
  const booking = value as Record<string, unknown>;
  return (
    typeof booking.id === "string" &&
    typeof booking.reference === "string" &&
    (booking.status === "pending" ||
      booking.status === "confirmed" ||
      booking.status === "cancelled") &&
    typeof booking.serviceId === "string" &&
    typeof booking.serviceName === "string" &&
    typeof booking.date === "string" &&
    typeof booking.time === "string" &&
    typeof booking.name === "string" &&
    typeof booking.phone === "string" &&
    typeof booking.email === "string" &&
    typeof booking.vehicle === "string" &&
    typeof booking.notes === "string" &&
    typeof booking.createdAt === "string"
  );
}

async function readLegacyBookings(): Promise<Booking[]> {
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLegacyBooking)) {
    throw new Error(`Cannot migrate invalid booking data in ${DATA_FILE}.`);
  }
  return parsed;
}

function isActiveSlotConflict(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) return false;
  const databaseError = error as Error & { code?: string; sqlMessage?: string };
  const message = `${databaseError.message} ${databaseError.sqlMessage ?? ""}`;
  return (
    databaseError.code === "ER_DUP_ENTRY" &&
    message.includes("uq_active_booking_slot")
  );
}

function toMysqlDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid booking timestamp: ${isoDate}`);
  }
  return date.toISOString().slice(0, 23).replace("T", " ");
}

function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    date: row.date,
    time: row.time,
    name: row.name,
    phone: row.phone,
    email: row.email,
    vehicle: row.vehicle,
    notes: row.notes,
    createdAt: `${row.createdAt.replace(" ", "T")}Z`,
  };
}

const BOOKING_SELECT = `
  SELECT
    id,
    reference,
    status,
    service_id AS serviceId,
    service_name AS serviceName,
    DATE_FORMAT(booking_date, '%Y-%m-%d') AS date,
    TIME_FORMAT(booking_time, '%H:%i') AS time,
    name,
    phone,
    email,
    vehicle,
    notes,
    created_at AS createdAt
  FROM bookings
`;

async function migrateLegacyBookings(pool: Pool): Promise<void> {
  const [migrations] = await pool.execute<RowDataPacket[]>(
    "SELECT migration_key FROM app_migrations WHERE migration_key = ?",
    [MIGRATION_KEY],
  );
  if (migrations.length > 0) return;

  const legacyBookings = await readLegacyBookings();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [countRows] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM bookings",
    );
    const existingBookings = Number(countRows[0].count);
    if (legacyBookings.length > 0 && existingBookings > 0) {
      throw new Error(
        "Cannot import JSON bookings because the MySQL bookings table is not empty. " +
          "Choose an empty database or migrate the records manually.",
      );
    }

    for (const booking of legacyBookings) {
      await connection.execute(
        `INSERT INTO bookings (
          id, reference, status, service_id, service_name, booking_date,
          booking_time, name, phone, email, vehicle, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.id,
          booking.reference,
          booking.status,
          booking.serviceId,
          booking.serviceName,
          booking.date,
          booking.time,
          booking.name,
          booking.phone,
          booking.email,
          booking.vehicle,
          booking.notes,
          toMysqlDateTime(booking.createdAt),
        ],
      );
    }

    await connection.execute(
      "INSERT INTO app_migrations (migration_key) VALUES (?)",
      [MIGRATION_KEY],
    );
    await connection.commit();
    console.log(`Imported ${legacyBookings.length} legacy booking(s) into MySQL.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function initializeStore(): Promise<void> {
  if (database) return;

  const user = process.env.MYSQL_USER;
  const databaseName = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT ?? 3306);
  if (!user || !databaseName) {
    throw new Error(
      "Set MYSQL_USER and MYSQL_DATABASE in backend/.env before starting the API.",
    );
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("MYSQL_PORT must be a valid TCP port.");
  }

  const pool = createPool({
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port,
    user,
    password: process.env.MYSQL_PASSWORD ?? "",
    database: databaseName,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
    dateStrings: true,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id CHAR(16) NOT NULL PRIMARY KEY,
        reference VARCHAR(32) NOT NULL UNIQUE,
        status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
        service_id VARCHAR(64) NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        name VARCHAR(120) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(254) NOT NULL,
        vehicle VARCHAR(120) NOT NULL,
        notes TEXT NOT NULL,
        created_at DATETIME(3) NOT NULL,
        active_booking_date DATE GENERATED ALWAYS AS (
          CASE WHEN status = 'cancelled' THEN NULL ELSE booking_date END
        ) STORED,
        active_booking_time TIME GENERATED ALWAYS AS (
          CASE WHEN status = 'cancelled' THEN NULL ELSE booking_time END
        ) STORED,
        UNIQUE KEY uq_active_booking_slot (
          active_booking_date, active_booking_time
        )
      ) ENGINE=InnoDB
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        migration_key VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB
    `);
    await migrateLegacyBookings(pool);
    database = pool;
  } catch (error) {
    await pool.end();
    throw error;
  }
}

export async function readBookings(): Promise<Booking[]> {
  const [rows] = await getDatabase().query<BookingRow[]>(
    `${BOOKING_SELECT} ORDER BY created_at DESC`,
  );
  return rows.map(mapBookingRow);
}

export async function getSlotsForDate(
  date: string,
  allSlots: string[],
): Promise<SlotStatus[]> {
  const [rows] = await getDatabase().execute<RowDataPacket[]>(
    `SELECT TIME_FORMAT(booking_time, '%H:%i') AS time, status
     FROM bookings
     WHERE booking_date = ? AND status <> 'cancelled'`,
    [date],
  );
  const bookedSlots = new Map<string, Booking["status"]>(
    rows.map((row) => [String(row.time), row.status as Booking["status"]]),
  );

  return allSlots.map((time) => {
    const status = bookedSlots.get(time);
    if (!status) return { time, status: "available" };
    return { time, status: status === "confirmed" ? "confirmed" : "pending" };
  });
}

export async function addBooking(input: BookingInput): Promise<Booking> {
  const service = getService(input.serviceId);
  if (!service) {
    throw new BookingError("Unknown service.", {
      serviceId: "Unknown service selected.",
    });
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

  try {
    await getDatabase().execute(
      `INSERT INTO bookings (
        id, reference, status, service_id, service_name, booking_date,
        booking_time, name, phone, email, vehicle, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.id,
        booking.reference,
        booking.status,
        booking.serviceId,
        booking.serviceName,
        booking.date,
        booking.time,
        booking.name,
        booking.phone,
        booking.email,
        booking.vehicle,
        booking.notes,
        toMysqlDateTime(booking.createdAt),
      ],
    );
  } catch (error) {
    if (isActiveSlotConflict(error)) {
      throw new BookingError(
        "That time slot is already taken. Please choose another time.",
        { time: "This slot is already booked." },
      );
    }
    throw error;
  }

  const updated = await getSlotsForDate(input.date, TIME_SLOTS);
  broadcastSlotUpdate(input.date, updated);
  return booking;
}

export async function updateBookingStatus(
  id: string,
  status: Booking["status"],
): Promise<Booking | null> {
  const pool = getDatabase();
  try {
    await pool.execute("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
  } catch (error) {
    if (isActiveSlotConflict(error)) {
      throw new BookingError(
        "That time slot is already taken. Please choose another time.",
        { status: "This slot is already booked." },
      );
    }
    throw error;
  }

  const [rows] = await pool.execute<BookingRow[]>(
    `${BOOKING_SELECT} WHERE id = ?`,
    [id],
  );
  if (rows.length === 0) return null;

  const booking = mapBookingRow(rows[0]);
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
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await getDatabase().execute<RowDataPacket[]>(
    `SELECT
      COUNT(*) AS total,
      SUM(status = 'pending') AS pending,
      SUM(status = 'confirmed') AS confirmed,
      SUM(status = 'cancelled') AS cancelled,
      SUM(booking_date = ? AND status <> 'cancelled') AS today
    FROM bookings`,
    [today],
  );
  const stats = rows[0];
  return {
    total: Number(stats.total),
    pending: Number(stats.pending),
    confirmed: Number(stats.confirmed),
    cancelled: Number(stats.cancelled),
    today: Number(stats.today),
  };
}
