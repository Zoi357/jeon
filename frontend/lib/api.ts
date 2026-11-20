const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type BookingRequest = {
  serviceId: string;
  date: string;
  time: string;
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
  phone: string;
  email: string;
  vehicle: string;
  notes: string;
  createdAt: string;
};

export type SlotStatus = {
  time: string;
  status: "available" | "pending" | "confirmed";
};

export type AdminStats = {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  today: number;
};

export async function fetchSlots(date: string): Promise<SlotStatus[]> {
  const res = await fetch(`${API_URL}/api/slots?date=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.slots as SlotStatus[];
}

export function getSlotsStreamUrl(date: string): string {
  return `${API_URL}/api/slots/stream?date=${encodeURIComponent(date)}`;
}

export async function createBooking(
  payload: BookingRequest,
): Promise<BookingResponse> {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error ?? "Failed to submit booking") as Error & {
      fields?: Record<string, string>;
    };
    e.fields = data.fields;
    throw e;
  }
  return data as BookingResponse;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function adminLogin(
  username: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Login failed.");
  }
}

export async function adminLogout(): Promise<void> {
  await fetch(`${API_URL}/api/admin/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function adminCheckSession(): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/me`, {
    credentials: "include",
    cache: "no-store",
  });
  return res.ok;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function fetchAdminBookings(): Promise<BookingResponse[]> {
  const res = await fetch(`${API_URL}/api/admin/bookings`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function updateBookingStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled",
): Promise<BookingResponse> {
  const res = await fetch(`${API_URL}/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update booking.");
  return res.json();
}
