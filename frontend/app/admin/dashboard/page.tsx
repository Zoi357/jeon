"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  adminCheckSession,
  adminLogout,
  fetchAdminStats,
  fetchAdminBookings,
  updateBookingStatus,
  type AdminStats,
  type BookingResponse,
} from "@/lib/api";
import { BUSINESS } from "@/lib/services";
import Image from "next/image";

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loggedIn = await adminCheckSession();
    if (!loggedIn) { router.push("/admin/login"); return; }
    const [s, b] = await Promise.all([fetchAdminStats(), fetchAdminBookings()]);
    setStats(s);
    setBookings(b);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 s.
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function handleLogout() {
    await adminLogout();
    router.push("/admin/login");
  }

  async function handleStatus(id: string, status: BookingResponse["status"]) {
    setUpdating(id);
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      const s = await fetchAdminStats();
      setStats(s);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = bookings.filter(
    (b) => filter === "all" || b.status === filter,
  );

  const statusBadge = (status: BookingResponse["status"]) => {
    if (status === "confirmed")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "cancelled")
      return "bg-zinc-100 text-zinc-500 border-zinc-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.webp" alt={BUSINESS.name} width={32} height={32} className="rounded object-contain" />
            <span className="text-sm font-bold text-zinc-800">
              {BUSINESS.shortName} — Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Total", value: stats.total, colour: "text-zinc-900" },
              { label: "Today", value: stats.today, colour: "text-brand-600" },
              { label: "Pending", value: stats.pending, colour: "text-amber-600" },
              { label: "Confirmed", value: stats.confirmed, colour: "text-green-600" },
              { label: "Cancelled", value: stats.cancelled, colour: "text-zinc-400" },
            ].map(({ label, value, colour }) => (
              <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
                <p className={`mt-1 text-3xl font-black ${colour}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bookings table */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-100 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-700 self-center mr-2">Bookings</span>
            {(["all", "pending", "confirmed", "cancelled"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition capitalize ${
                  filter === f
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={load}
              className="ml-auto rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-zinc-100 sm:hidden">
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">No bookings.</p>
            )}
            {filtered.map((b) => (
              <div key={b.id} className="px-4 py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-zinc-700">{b.reference}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <p className="font-semibold text-zinc-900">{b.name}</p>
                <p className="text-sm text-zinc-500">{b.serviceName}</p>
                <p className="text-sm text-zinc-500">{b.date} at {b.time}</p>
                <p className="text-sm text-zinc-500">{b.vehicle}</p>
                <p className="text-xs text-zinc-400">{b.phone} · {b.email}</p>
                <div className="flex gap-2 pt-1">
                  {b.status !== "confirmed" && (
                    <button onClick={() => handleStatus(b.id, "confirmed")} disabled={updating === b.id}
                      className="rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-400 disabled:opacity-50">
                      Confirm
                    </button>
                  )}
                  {b.status !== "cancelled" && (
                    <button onClick={() => handleStatus(b.id, "cancelled")} disabled={updating === b.id}
                      className="rounded-md bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  {["Reference", "Name", "Service", "Date & Time", "Vehicle", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-zinc-400">No bookings.</td>
                  </tr>
                )}
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-700 whitespace-nowrap">{b.reference}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-zinc-900">{b.name}</p>
                      <p className="text-xs text-zinc-400">{b.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{b.serviceName}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{b.date} {b.time}</td>
                    <td className="px-4 py-3 text-zinc-700">{b.vehicle}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        {b.status !== "confirmed" && (
                          <button onClick={() => handleStatus(b.id, "confirmed")} disabled={updating === b.id}
                            className="rounded-md bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-400 disabled:opacity-50">
                            Confirm
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button onClick={() => handleStatus(b.id, "cancelled")} disabled={updating === b.id}
                            className="rounded-md bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
