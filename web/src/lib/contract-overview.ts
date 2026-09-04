import type { Contract } from "./contracts";

export function contractTiming(contract: Contract, today: string) {
  const daysRemaining = Math.round((Date.parse(`${contract.endDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  const active = contract.status === "Active" && contract.startDate <= today && contract.endDate >= today;
  return { active, daysRemaining, renewal: active && daysRemaining <= 120, expiring: active && daysRemaining <= 30 };
}
