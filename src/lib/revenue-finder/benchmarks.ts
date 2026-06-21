import type { SalesMotion } from "./types";

export type PriceTier = "ultra-low" | "low" | "mid" | "high" | "premium";

export function getPriceTier(price: number): PriceTier {
  if (price < 100) return "ultra-low";
  if (price < 500) return "low";
  if (price < 2000) return "mid";
  if (price < 10000) return "high";
  return "premium";
}

export function getExpectedCloseRate(price: number, motion: SalesMotion): number {
  if (motion === "salesCall") {
    if (price < 100) return 0.20;
    if (price < 500) return 0.25;
    if (price < 2000) return 0.30;
    if (price < 10000) return 0.30;
    return 0.30;
  }
  if (price < 500) return 0.04;
  if (price < 1000) return 0.015;
  if (price < 2000) return 0.0075;
  return 0.003;
}

export function getExpectedLeadToOpportunityRate(
  price: number,
  motion: SalesMotion,
): number {
  if (motion === "salesCall") {
    if (price < 100) return 0.30;
    if (price < 500) return 0.30;
    if (price < 2000) return 0.25;
    if (price < 10000) return 0.20;
    return 0.15;
  }
  if (price < 100) return 0.40;
  if (price < 500) return 0.35;
  if (price < 2000) return 0.35;
  if (price < 10000) return 0.30;
  return 0.25;
}

export function getExpectedAttendanceRate(
  price: number,
  motion: SalesMotion,
): number {
  if (motion === "salesCall") {
    if (price < 500) return 0.75;
    return 0.78;
  }
  return getExpectedLeadToOpportunityRate(price, motion);
}

export function getExpectedLifespan(price: number): number {
  if (price < 100) return 3;
  if (price < 500) return 6;
  if (price < 2000) return 9;
  if (price < 10000) return 12;
  return 18;
}

export function getExpectedUpsellPercent(price: number): number {
  if (price < 100) return 0.10;
  if (price < 500) return 0.15;
  if (price < 2000) return 0.20;
  if (price < 10000) return 0.20;
  return 0.25;
}
