import { AdminReport } from "@/components/admin-report";

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ billingMonth?: string }> }) {
  return <AdminReport billingMonth={(await searchParams).billingMonth} />;
}
