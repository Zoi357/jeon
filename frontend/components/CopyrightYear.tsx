"use client";
import { useEffect, useState } from "react";

// Read the year on the client only (inside useEffect), so the build's static
// prerender never calls Date() — Cache Components treats current-time reads as
// unstable. Renders nothing until the effect runs, which is fine for a footer.
export default function CopyrightYear() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <>{year ?? ""}</>;
}
