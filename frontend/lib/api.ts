// Thin client for the Express backend.
// API base URL is configured via NEXT_PUBLIC_API_URL (see .env.local).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type BookingRequest = {
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  notes?: string;
};

export type BookingResponse = {
  id: string;
  reference: string;
  status: "pending" | "confirmed" | "cancelled";
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  name: string;
  createdAt: string;
};

export type ApiError = {
  error: string;
  fields?: Record<string, string>;
};

export async function createBooking(
  payload: BookingRequest,
): Promise<BookingResponse> {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({} as Record<string, unknown>));

  if (!res.ok) {
    const err = data as ApiError;
    const e = new Error(err.error ?? "Failed to submit booking") as Error & {
      fields?: Record<string, string>;
    };
    e.fields = err.fields;
    throw e;
  }

  return data as BookingResponse;
}
