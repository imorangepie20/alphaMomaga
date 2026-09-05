import { AdminAudit, type AuditSearchParams } from "@/components/admin-audit";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<AuditSearchParams> }) {
  return <AdminAudit searchParams={await searchParams} />;
}
