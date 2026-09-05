import { OperationalDashboard } from "@/components/operational-dashboard";

export default async function RevenuePage({ searchParams }: { searchParams: Promise<{ billingMonth?: string }> }) {
  const { billingMonth } = await searchParams;
  return <OperationalDashboard mode="revenue" billingMonth={billingMonth} />;
}
