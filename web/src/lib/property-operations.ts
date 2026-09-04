import type { MonthlyCharge } from "./billing";
import type { Contract } from "./contracts";
import type { Inspection } from "./inspections";
import type { Maintenance } from "./maintenance";
import type { Property } from "./properties";
import type { Tenant } from "./tenants";

type PropertyOperationsInput = {
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  charges: MonthlyCharge[];
  maintenance: Maintenance[];
  inspections: Inspection[];
  today: string;
};

export type PropertyOperationRow = Property & {
  tenantCount: number;
  activeContractCount: number;
  draftCount: number;
  billedWon: number;
  receivedWon: number;
  outstandingWon: number;
  expiringContractCount: number;
  openWorkCount: number;
  needsAttention: boolean;
};

function isWithinNinetyDays(date: string, today: string) {
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const reference = new Date(`${today}T00:00:00Z`).getTime();
  return target >= reference && target <= reference + 90 * 24 * 60 * 60 * 1000;
}

export function buildPropertyOperations({ properties, tenants, contracts, charges, maintenance, inspections, today }: PropertyOperationsInput) {
  const rows: PropertyOperationRow[] = properties.map((property) => {
    const tenantCount = tenants.filter((tenant) => tenant.propertyId === property.id).length;
    const propertyContracts = contracts.filter((contract) => contract.propertyId === property.id && contract.status === "Active" && contract.startDate <= today && contract.endDate >= today);
    const monthlyCharges = charges.filter((charge) => charge.propertyId === property.id && charge.billingMonth === today.slice(0, 7));
    const draftCount = monthlyCharges.filter((charge) => charge.status === "Draft").length;
    const propertyCharges = monthlyCharges.filter((charge) => charge.status !== "Draft" && charge.status !== "Cancelled");
    const billedWon = propertyCharges.reduce((total, charge) => total + charge.billedWon, 0);
    const receivedWon = propertyCharges.reduce((total, charge) => total + charge.receivedWon, 0);
    const outstandingWon = propertyCharges.reduce((total, charge) => total + charge.outstandingWon, 0);
    const expiringContractCount = propertyContracts.filter((contract) => isWithinNinetyDays(contract.endDate, today)).length;
    const openMaintenance = maintenance.filter((item) => item.propertyId === property.id && item.status !== "Completed").length;
    const openInspections = inspections.filter((item) => item.propertyId === property.id && item.status !== "Completed").length;
    const openWorkCount = openMaintenance + openInspections;
    const needsAttention = property.status === "Pending" || draftCount > 0 || outstandingWon > 0 || expiringContractCount > 0 || openWorkCount > 0;

    return { ...property, tenantCount, activeContractCount: propertyContracts.length, draftCount, billedWon, receivedWon, outstandingWon, expiringContractCount, openWorkCount, needsAttention };
  });

  const averageOccupancy = properties.length
    ? Math.round(properties.reduce((total, property) => total + Number.parseInt(property.occupancy, 10), 0) / properties.length)
    : 0;

  return {
    summary: {
      propertyCount: properties.length,
      averageOccupancy,
      outstandingWon: rows.reduce((total, row) => total + row.outstandingWon, 0),
      actionRequiredCount: rows.filter((row) => row.needsAttention).length,
    },
    rows,
  };
}
