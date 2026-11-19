import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import { SERVICES, BUSINESS } from "@/lib/services";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grid bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs font-medium text-brand-400">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Now accepting bookings
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
              {BUSINESS.name.split(" ")[0]}{" "}
              <span className="text-brand-500">Engineering</span> Services
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              {BUSINESS.tagline} Book your slot online in under a minute — pick a
              service, choose a time, and we’ll confirm by phone or email.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400"
              >
                Book an appointment
              </Link>
              <a
                href="#services"
                className="rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-zinc-500"
              >
                View services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {[
            ["20+", "Years experience"],
            ["5,000+", "Cars serviced"],
            ["Certified", "Master technicians"],
            ["12-month", "Workmanship warranty"],
          ].map(([big, small]) => (
            <div key={small} className="text-center sm:text-left">
              <div className="text-2xl font-black text-zinc-900">{big}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {small}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Our services
          </h2>
          <p className="mt-3 text-zinc-600">
            From a quick diagnostic to a full engine build — book the service you
            need and we’ll handle the rest.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900">
            How booking works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              ["1", "Pick a service", "Choose what your car needs from our catalogue, or start from any service card."],
              ["2", "Choose a time", "Select a date and an open slot that suits you."],
              ["3", "We confirm", "You get a booking reference instantly. We call or email to confirm details."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-bold text-zinc-950">
                  {n}
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get your car booked in?
          </h2>
          <p className="max-w-xl text-zinc-300">
            Choose a service and a time that works for you. It takes less than a
            minute.
          </p>
          <Link
            href="/book"
            className="rounded-md bg-brand-500 px-8 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400"
          >
            Book now
          </Link>
        </div>
      </section>
    </>
  );
}
