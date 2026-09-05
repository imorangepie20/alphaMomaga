import { AdminUserDirectory } from "@/components/admin-user-directory";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; email?: string }> }) {
  return <AdminUserDirectory {...await searchParams} />;
}
