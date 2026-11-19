import { Suspense } from "react";
import Link from "next/link";

// Static shell — no runtime data access at this level.
export default function SuccessPage() {
  return (
    <div className="bg-zinc-50">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">
          Booking request received
        </h1>
        <p className="mt-3 text-zinc-600">
          Thanks — your request has been logged. Our team will call or email you
          shortly to confirm the details.
        </p>

        {/*
          ?ref= is a runtime API — read it in a child inside Suspense so
          the static heading above can be prerendered (Cache Components pattern).
        */}
        <Suspense fallback={<RefSkeleton />}>
          <BookingRef />
        </Suspense>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
          >
            Back to home
          </Link>
          <Link
            href="/book"
            className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400"
          >
            Book another
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reads ?ref= at request time inside its Suspense boundary.
async function BookingRef({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const ref = params.ref ?? "";

  if (!ref) return null;

  return (
    <div className="mt-8 w-full rounded-xl border border-zinc-200 bg-white px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Your booking reference
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-zinc-900">
        {ref}
      </p>
      <p className="mt-3 text-xs text-zinc-500">
        Keep this reference handy. Quote it if you need to change or cancel your
        appointment.
      </p>
    </div>
  );
}

function RefSkeleton() {
  return (
    <div className="mt-8 w-full animate-pulse rounded-xl border border-zinc-200 bg-white px-6 py-5">
      <div className="mx-auto h-4 w-32 rounded bg-zinc-100" />
      <div className="mx-auto mt-3 h-8 w-40 rounded bg-zinc-100" />
    </div>
  );
}
