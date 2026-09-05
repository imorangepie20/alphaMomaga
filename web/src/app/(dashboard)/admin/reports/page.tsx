import { AdminReport } from "@/components/admin-report";

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ billingMonth?: string | string[] }> }) {
  return <AdminReport billingMonth={(await searchParams).billingMonth} />;
}
