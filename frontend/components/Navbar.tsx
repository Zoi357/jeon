"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { BUSINESS } from "@/lib/services";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/#services", label: "Services" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.webp"
            alt={BUSINESS.name}
            width={40}
            height={40}
            preload
            className="rounded object-contain"
          />
          <span className="text-sm font-bold tracking-tight text-white sm:text-base">
            {BUSINESS.shortName.toUpperCase()}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400"
          >
            Book Now
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-white md:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 md:hidden">
          <div className="flex flex-col px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-zinc-300"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-zinc-950"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
