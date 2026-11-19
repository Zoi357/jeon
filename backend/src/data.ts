import type { Service } from "./types";

// Source of truth for the service catalogue.
// Keep in sync with the Next.js frontend (frontend/lib/services.ts).
export const SERVICES: Service[] = [
  {
    id: "undercoating",
    name: "Undercoating",
    description:
      "Protective undercoating applied to the vehicle's undercarriage to prevent rust, corrosion, and road noise.",
    durationLabel: "2–3 hrs",
  },
  {
    id: "body-repair",
    name: "Body Repair and Painting Works",
    description:
      "Full body repair covering dents, scratches, and panel damage, finished with professional paint matching and blending.",
    durationLabel: "1–5 days",
  },
  {
    id: "graphene-coating",
    name: "Graphene Coating",
    description:
      "Premium graphene ceramic coating that provides long-lasting paint protection, hydrophobic finish, and enhanced gloss.",
    durationLabel: "1–2 days",
  },
  {
    id: "tinting",
    name: "Tinting Works",
    description:
      "Professional window film installation for heat rejection, UV protection, glare reduction, and added privacy.",
    durationLabel: "2–4 hrs",
  },
  {
    id: "pms",
    name: "Fleet / Car PMS",
    description:
      "Preventive Maintenance Service for individual vehicles and fleets — oil change, filters, fluids, belts, and full inspection.",
    durationLabel: "1–2 hrs",
  },
  {
    id: "aircon",
    name: "Aircon Works",
    description:
      "Complete aircon servicing including cleaning, gas recharge, compressor check, leak testing, and component replacement.",
    durationLabel: "1–3 hrs",
  },
];

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const getService = (id: string): Service | undefined =>
  SERVICES.find((s) => s.id === id);
