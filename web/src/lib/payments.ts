import { getApiUrl } from "@/lib/api-url";

export type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Cancelled";

export type Payment = {
  id: string;
  propertyId: string;
  contractId: string;
  amount: string;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
};

const fallbackPayments: Payment[] = [
  { id: "payment-1", propertyId: "property-1", contractId: "contract-1", amount: "₩12,400,000", dueDate: "2026-08-31", status: "Paid", paidAt: "2026-08-29" },
  { id: "payment-2", propertyId: "property-2", contractId: "contract-2", amount: "₩9,800,000", dueDate: "2026-08-05", status: "Overdue" },
  { id: "payment-3", propertyId: "property-3", contractId: "contract-3", amount: "₩8,200,000", dueDate: "2026-09-10", status: "Pending" },
  { id: "payment-4", propertyId: "property-4", contractId: "contract-4", amount: "₩15,300,000", dueDate: "2026-09-11", status: "Paid", paidAt: "2026-09-01" },
];

export async function getPayments(): Promise<Payment[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return fallbackPayments;

  try {
    const response = await fetch(`${apiUrl}/payments`, { cache: "no-store" });
    if (!response.ok) return fallbackPayments;
    return (await response.json()) as Payment[];
  } catch {
    return fallbackPayments;
  }
}