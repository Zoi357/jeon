"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SERVICES, TIME_SLOTS, getService } from "@/lib/services";
import {
  createBooking,
  fetchSlots,
  getSlotsStreamUrl,
  type BookingRequest,
  type SlotStatus,
} from "@/lib/api";

type Errors = Partial<Record<keyof BookingRequest, string>>;

// Characters allowed in text fields — block injection / special chars.
const SAFE_RE = /^[a-zA-Z0-9\s.,'\-&#@():\/]*$/;

const todayStr = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

function sanitise(value: string): string {
  // Strip characters outside the allowed set rather than rejecting outright;
  // the server validates independently.
  return value.replace(/[^a-zA-Z0-9\s.,'\-&#@():\/]/g, "");
}

export default function BookingForm({
  initialServiceId = "",
}: {
  initialServiceId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [form, setForm] = useState<BookingRequest>({
    serviceId: initialServiceId,
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    notes: "",
  });

  // ── Slot loading + real-time SSE ───────────────────────────────────────────
  const loadSlots = useCallback(async (date: string) => {
    if (!date) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const s = await fetchSlots(date);
      setSlots(s);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!form.date) { setSlots([]); return; }

    loadSlots(form.date);

    // Open SSE stream for live updates.
    const url = getSlotsStreamUrl(form.date);
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as { date: string; slots: SlotStatus[] };
        if (payload.date === form.date) {
          setSlots(payload.slots);
          // If the selected slot became unavailable, clear it.
          setForm((f) => {
            const stillOk = payload.slots.find(
              (s) => s.time === f.time && s.status === "available",
            );
            return stillOk ? f : { ...f, time: "" };
          });
        }
      } catch { /* ignore parse errors */ }
    };
    return () => es.close();
  }, [form.date, loadSlots]);

  // ── Field updaters ─────────────────────────────────────────────────────────
  const updateRaw =
    (field: keyof BookingRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const updateSafe =
    (field: keyof BookingRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const clean = sanitise(e.target.value);
      setForm((f) => ({ ...f, [field]: clean }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const selectTime = (time: string) => {
    setForm((f) => ({ ...f, time }));
    setErrors((prev) => ({ ...prev, time: undefined }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: Errors = {};
    if (!form.serviceId) next.serviceId = "Please choose a service.";
    if (!form.date) next.date = "Please pick a date.";
    else if (form.date < todayStr()) next.date = "Date cannot be in the past.";
    if (!form.time) next.time = "Please pick a time slot.";
    if (!form.name || form.name.trim().length < 2)
      next.name = "Please enter your full name.";
    else if (!SAFE_RE.test(form.name))
      next.name = "Name contains invalid characters.";
    if (!form.phone || form.phone.trim().length < 6)
      next.phone = "Please enter a contact number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Please enter a valid email.";
    if (!form.vehicle || form.vehicle.trim().length < 2)
      next.vehicle = "Please enter the vehicle make, model or registration.";
    else if (!SAFE_RE.test(form.vehicle))
      next.vehicle = "Vehicle description contains invalid characters.";
    if (form.notes && !SAFE_RE.test(form.notes))
      next.notes = "Notes contain invalid characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const booking = await createBooking(form);
      router.push(`/book/success?ref=${encodeURIComponent(booking.reference)}`);
    } catch (err) {
      const ex = err as Error & { fields?: Record<string, string> };
      setServerError(ex.message ?? "Something went wrong. Please try again.");
      if (ex.fields) setErrors((prev) => ({ ...prev, ...ex.fields }));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputBase =
    "mt-1.5 w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40";
  const ok = "border-zinc-300 focus:border-brand-500";
  const bad = "border-red-400 focus:border-red-500";
  const cls = (field: keyof BookingRequest) =>
    `${inputBase} ${errors[field] ? bad : ok}`;

  const slotColour = (s: SlotStatus) => {
    if (s.status === "confirmed")
      return "bg-red-100 text-red-700 border-red-300 cursor-not-allowed";
    if (s.status === "pending")
      return "bg-amber-100 text-amber-700 border-amber-300 cursor-not-allowed";
    if (form.time === s.time)
      return "bg-brand-500 text-zinc-950 border-brand-500 font-semibold";
    return "bg-white text-zinc-700 border-zinc-300 hover:border-brand-400 hover:bg-brand-50 cursor-pointer";
  };

  const selected = getService(form.serviceId);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Service */}
      <div>
        <label htmlFor="serviceId" className="text-sm font-semibold text-zinc-700">
          Service
        </label>
        <select
          id="serviceId"
          value={form.serviceId}
          onChange={updateRaw("serviceId")}
          className={cls("serviceId")}
        >
          <option value="">Select a service…</option>
          {SERVICES.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.serviceId && (
          <p className="mt-1 text-xs text-red-600">{errors.serviceId}</p>
        )}
        {selected && (
          <p className="mt-1.5 text-xs text-zinc-500">{selected.description}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="text-sm font-semibold text-zinc-700">
          Preferred date
        </label>
        <input
          id="date"
          type="date"
          min={todayStr()}
          value={form.date}
          onChange={updateRaw("date")}
          className={cls("date")}
        />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
      </div>

      {/* Time slot grid */}
      {form.date && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">
              Preferred time
            </span>
            {slotsLoading && (
              <span className="text-xs text-zinc-400">Loading slots…</span>
            )}
          </div>

          {/* Legend */}
          <div className="mb-3 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-zinc-300 bg-white" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-red-300 bg-red-100" />
              Fully booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-brand-500 bg-brand-500" />
              Selected
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.length === 0 && !slotsLoading
              ? TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => selectTime(t)}
                    className={`rounded-md border px-3 py-2 text-sm transition ${
                      form.time === t
                        ? "bg-brand-500 text-zinc-950 border-brand-500 font-semibold"
                        : "bg-white text-zinc-700 border-zinc-300 hover:border-brand-400 hover:bg-brand-50"
                    }`}
                  >
                    {t}
                  </button>
                ))
              : slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={s.status !== "available"}
                    onClick={() => s.status === "available" && selectTime(s.time)}
                    className={`rounded-md border px-3 py-2 text-sm transition ${slotColour(s)}`}
                    title={
                      s.status === "confirmed"
                        ? "Fully booked"
                        : s.status === "pending"
                        ? "Pending — choose another slot"
                        : s.time
                    }
                  >
                    {s.time}
                  </button>
                ))}
          </div>
          {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
        </div>
      )}

      <hr className="border-zinc-100" />

      {/* Customer details */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-zinc-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={updateSafe("name")}
            className={cls("name")}
            autoComplete="name"
            maxLength={60}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-semibold text-zinc-700">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={updateRaw("phone")}
            className={cls("phone")}
            autoComplete="tel"
            maxLength={20}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={updateRaw("email")}
            className={cls("email")}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="vehicle" className="text-sm font-semibold text-zinc-700">
            Vehicle (make, model or reg)
          </label>
          <input
            id="vehicle"
            type="text"
            value={form.vehicle}
            onChange={updateSafe("vehicle")}
            className={cls("vehicle")}
            placeholder="e.g. Toyota Vios 2020"
            maxLength={100}
          />
          {errors.vehicle && (
            <p className="mt-1 text-xs text-red-600">{errors.vehicle}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="text-sm font-semibold text-zinc-700">
            Notes{" "}
            <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={updateSafe("notes")}
            className={`${cls("notes")} resize-none`}
            placeholder="Anything we should know about the car or the issue…"
            maxLength={500}
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
          )}
        </div>
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-zinc-500 sm:text-left">
          A confirmation email will be sent after booking. We'll also call to finalise.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-500 px-8 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Submitting…" : "Confirm booking"}
        </button>
      </div>
    </form>
  );
}
