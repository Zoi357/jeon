import Link from "next/link";
import type { Service } from "@/lib/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-lg">
      <h3 className="text-lg font-bold text-zinc-900">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
        {service.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
        <span className="text-zinc-500">{service.durationLabel}</span>
        <Link
          href={`/book?service=${service.id}`}
          className="font-semibold text-brand-600 transition group-hover:text-brand-700"
        >
          Book →
        </Link>
      </div>
    </article>
  );
}
