import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getApprovalStatus } from "@/lib/approval-status";
import { AuthCard } from "@/components/auth/auth-card";

export default async function PendingApprovalPage() {
  await requireSession();
  const status = await getApprovalStatus();
  if (status === "approved") redirect("/dashboard/default");
  return <AuthCard
    title={status === "pending" ? "관리자 승인을 기다리고 있어요" : "승인 상태를 확인할 수 없습니다"}
    description={status === "pending" ? "회원가입과 로그인은 완료되었습니다. 관리자가 업무 역할을 부여하면 서비스를 이용할 수 있습니다." : "인증이 만료되었거나 서버 연결에 문제가 있습니다. 다시 로그인하거나 잠시 후 확인해 주세요."}
    footer={<a href="/auth/logout" className="underline underline-offset-4">로그아웃</a>}
  >
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">승인 안내를 받은 뒤 다시 로그인하면 새 권한이 반영됩니다. 권한 부여 전에는 업무 데이터에 접근할 수 없습니다.</p>
      <a href="/auth/login?prompt=login&returnTo=%2Fpending-approval" className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">다시 로그인하여 권한 갱신</a>
      <a href="/pending-approval" className="flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm">승인 상태 다시 확인</a>
    </div>
  </AuthCard>;
}
