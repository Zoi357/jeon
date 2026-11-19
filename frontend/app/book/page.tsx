import { Suspense } from "react";
import BookingForm from "@/components/BookingForm";
import { SERVICES } from "@/lib/services";

// Outer shell is static — no runtime data access here.
export default function BookPage() {
  return (
    <div className="bg-zinc-50">
      <div className="bg-grid bg-zinc-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Book an appointment
          </h1>
          <p className="mt-3 text-zinc-300">
            Choose a service and a time. It takes less than a minute.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          {/*
            searchParams is a runtime API — wrap the reader in Suspense so the
            static shell above can be prerendered while the form resolves the
            ?service= param at request time (Cache Components pattern).
          */}
          <Suspense fallback={<BookingFormSkeleton />}>
            <BookFormInner />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Reads searchParams at request time inside a Suspense boundary.
async function BookFormInner({
  searchParams,
}: {
  searchParams?: Promise<{ service?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialService = SERVICES.some((s) => s.id === params.service)
    ? (params.service as string)
    : "";
  return <BookingForm initialServiceId={initialService} />;
}

function BookingFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 rounded-md bg-zinc-100" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-10 rounded-md bg-zinc-100" />
        <div className="h-10 rounded-md bg-zinc-100" />
      </div>
      <div className="h-10 rounded-md bg-zinc-100" />
      <div className="h-10 rounded-md bg-zinc-100" />
      <div className="h-10 rounded-md bg-zinc-100" />
    </div>
  );
}
