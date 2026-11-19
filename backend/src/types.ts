export type Service = {
  id: string;
  name: string;
  description: string;
  durationLabel: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  reference: string;
  status: BookingStatus;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  notes: string;
  createdAt: string; // ISO timestamp
};

// What the client sends when creating a booking.
export type BookingInput = {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  notes?: string;
};
