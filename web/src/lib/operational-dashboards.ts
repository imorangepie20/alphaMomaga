import type { Property } from "./properties";
import type { Tenant } from "./tenants";
import type { Contract } from "./contracts";
import type { MonthlyCharge } from "./billing";
import { contractTiming } from "./contract-overview";

export function summarizeAssets(properties: Property[], tenants: Tenant[], contracts: Contract[], today: string) {
  const rows = properties.map((property) => {
    const related = contracts.filter((contract) => contract.propertyId === property.id);
    const parsed = /^\d+(\.\d+)?%$/.test(property.occupancy) ? Number(property.occupancy.slice(0, -1)) : NaN;
    return { ...property, occupancyValue: Number.isFinite(parsed) && parsed <= 100 ? parsed : null,
      tenants: tenants.filter((tenant) => tenant.propertyId === property.id).length,
      active: related.filter((contract) => contractTiming(contract, today).active).length,
      expiring: related.filter((contract) => contractTiming(contract, today).expiring).length,
    };
  });
  const occupancies = rows.flatMap((row) => row.occupancyValue === null ? [] : [row.occupancyValue]);
  return { rows, averageOccupancy: occupancies.length ? occupancies.reduce((sum, value) => sum + value, 0) / occupancies.length : null };
}

export function summarizeRevenue(properties: Property[], charges: MonthlyCharge[], month: string) {
  const selected = charges.filter((charge) => charge.billingMonth === month);
  const confirmed = selected.filter((charge) => charge.status !== "Draft" && charge.status !== "Cancelled");
  const ids = [...new Set([...properties.map((property) => property.id), ...confirmed.map((charge) => charge.propertyId)])];
  const rows = ids.map((id) => {
    const related = confirmed.filter((charge) => charge.propertyId === id);
    return { id, name: properties.find((property) => property.id === id)?.name ?? `연결 자산 확인 필요 (${id})`,
      count: related.length,
      billed: related.reduce((sum, charge) => sum + charge.billedWon, 0),
      received: related.reduce((sum, charge) => sum + charge.receivedWon, 0),
      outstanding: related.reduce((sum, charge) => sum + charge.outstandingWon, 0),
      overdue: related.filter((charge) => charge.status === "Overdue").length,
    };
  });
  const billed = rows.reduce((sum, row) => sum + row.billed, 0);
  const received = rows.reduce((sum, row) => sum + row.received, 0);
  return { rows, billed, received, outstanding: rows.reduce((sum, row) => sum + row.outstanding, 0),
    drafts: selected.filter((charge) => charge.status === "Draft").length,
    collectionRate: billed > 0 ? received / billed * 100 : null };
}
