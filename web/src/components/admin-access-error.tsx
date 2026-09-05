import { AdminAccessError } from "@/lib/admin-access";
import { BillingApiError } from "@/lib/billing";

export function AdminAccessNotice({ error }: { error: unknown }) {
  const status = error instanceof AdminAccessError || error instanceof BillingApiError ? error.status : 503;
  return <div className="space-y-3 rounded-lg border p-5"><p role="alert">{status === 401 ? "로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요." : status === 403 ? "이 페이지를 조회할 권한이 없습니다. 관리자에게 역할을 확인해 주세요." : "관리 정보를 불러오지 못했습니다. 잠시 후 다시 조회해 주세요."}</p><a href={status === 401 ? "/auth/login" : "/dashboard/real-estate"} className="text-sm underline">{status === 401 ? "다시 로그인" : "대시보드로 이동"}</a></div>;
}
