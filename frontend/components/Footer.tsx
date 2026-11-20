import Image from "next/image";
import { BUSINESS } from "@/lib/services";
import CopyrightYear from "@/components/CopyrightYear";

export default function Footer() {
  return (
    <footer id="contact" className="bg-zinc-950 text-zinc-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.webp"
              alt={BUSINESS.name}
              width={40}
              height={40}
              className="rounded object-contain"
            />
            <span className="text-sm font-bold tracking-tight text-white">
              {BUSINESS.name}
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
            {BUSINESS.tagline}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Visit
          </h4>
          <p className="mt-3 text-sm text-zinc-400">{BUSINESS.address}</p>
          <p className="mt-2 text-sm text-zinc-400">{BUSINESS.hours}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Contact
          </h4>
          <p className="mt-3 text-sm text-zinc-400">{BUSINESS.phone}</p>
          <p className="mt-1 text-sm text-zinc-400">{BUSINESS.email}</p>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-zinc-500">
          © <CopyrightYear /> {BUSINESS.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
