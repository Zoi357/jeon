"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICES, TIME_SLOTS, getService } from "@/lib/services";
import { createBooking, type BookingRequest } from "@/lib/api";

type Errors = Partial<Record<keyof BookingRequest, string>>;

const todayStr = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

export default function BookingForm({
  initialServiceId = "",
}: {
  initialServiceId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

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

  const update =
    (field: keyof BookingRequest) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  function validate(): boolean {
    const next: Errors = {};
    if (!form.serviceId) next.serviceId = "Please choose a service.";
    if (!form.date) next.date = "Please pick a date.";
    else if (form.date < todayStr()) next.date = "Date cannot be in the past.";
    if (!form.time) next.time = "Please pick a time slot.";
    if (!form.name || form.name.trim().length < 2)
      next.name = "Please enter your full name.";
    if (!form.phone || form.phone.trim().length < 6)
      next.phone = "Please enter a contact number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Please enter a valid email.";
    if (!form.vehicle || form.vehicle.trim().length < 2)
      next.vehicle = "Tell us the vehicle (make, model or registration).";

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
      const e = err as Error & { fields?: Record<string, string> };
      setServerError(e.message ?? "Something went wrong. Please try again.");
      if (e.fields) {
        setErrors((prev) => ({ ...prev, ...e.fields }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "mt-1.5 w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40";
  const ok = "border-zinc-300 focus:border-brand-500";
  const bad = "border-red-400 focus:border-red-500";
  const cls = (field: keyof BookingRequest) =>
    `${inputBase} ${errors[field] ? bad : ok}`;
  const selected = getService(form.serviceId);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Service + date + time */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="serviceId" className="text-sm font-semibold text-zinc-700">
            Service
          </label>
          <select
            id="serviceId"
            value={form.serviceId}
            onChange={update("serviceId")}
            className={cls("serviceId")}
          >
            <option value="">Select a service…</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.serviceId && (
            <p className="mt-1 text-xs text-red-600">{errors.serviceId}</p>
          )}
          {selected && (
            <p className="mt-2 text-xs text-zinc-500">{selected.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="text-sm font-semibold text-zinc-700">
            Preferred date
          </label>
          <input
            id="date"
            type="date"
            min={todayStr()}
            value={form.date}
            onChange={update("date")}
            className={cls("date")}
          />
          {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
        </div>

        <div>
          <label htmlFor="time" className="text-sm font-semibold text-zinc-700">
            Preferred time
          </label>
          <select
            id="time"
            value={form.time}
            onChange={update("time")}
            className={cls("time")}
          >
            <option value="">Select a slot…</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
        </div>
      </div>

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
            onChange={update("name")}
            className={cls("name")}
            autoComplete="name"
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
            onChange={update("phone")}
            className={cls("phone")}
            autoComplete="tel"
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
            onChange={update("email")}
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
            onChange={update("vehicle")}
            className={cls("vehicle")}
            placeholder="e.g. BMW M3 2018"
          />
          {errors.vehicle && (
            <p className="mt-1 text-xs text-red-600">{errors.vehicle}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="text-sm font-semibold text-zinc-700">
            Notes <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={update("notes")}
            className={`${cls("notes")} resize-none`}
            placeholder="Anything we should know about the car or the issue…"
          />
        </div>
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-zinc-500">
          You’ll receive a booking reference to confirm. We’ll call or email to
          finalise.
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
