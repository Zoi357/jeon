// Minimal inline icon set for the service cards. Keeps zero icon dependencies.
import type { JSX } from "react";

const ICONS: Record<string, JSX.Element> = {
  scan: (
    <>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M9 9h6v6H9z" />
    </>
  ),
  chip: (
    <>
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M9 4v2M15 4v2M9 18v2M15 18v2M4 9h2M4 15h2M18 9h2M18 15h2" />
    </>
  ),
  suspension: (
    <>
      <path d="M12 3v8M9 11h6" />
      <path d="M6 21a3 3 0 0 1 3-3 3 3 0 0 1 3 3M12 21a3 3 0 0 1 3-3 3 3 0 0 1 3 3" />
    </>
  ),
  disc: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  engine: (
    <>
      <path d="M6 9h2V7h4v2h2l3-2v12l-3-2h-2v0H8v0H6z" />
      <path d="M4 11v3M2 12h2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2l-.4-2.5H8.6l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 3.6 13l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h3.9l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="4" width="8" height="4" rx="1" />
      <path d="M16 6h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  weld: (
    <>
      <path d="M14 5l5 5-3 3-5-5z" />
      <path d="M11 8L4 15v5h5l7-7" />
      <path d="M3 21h7" />
    </>
  ),
};

export default function ServiceIcon({ name }: { name: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] ?? ICONS.scan}
    </svg>
  );
}
