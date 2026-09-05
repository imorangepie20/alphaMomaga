import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingApiError, getBillingSummary } from "@/lib/billing";

export const dynamic = "force-dynamic";

function currentBillingMonth() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
}

function formatWon(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export default async function DefaultDashboardPage() {
  const billingMonth = currentBillingMonth();
  let summary;
  try {
    summary = await getBillingSummary(billingMonth);
  } catch (error) {
    const message = error instanceof BillingApiError && error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : "이번 달 수납 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">운영 현황</h1><p role="alert" className="text-sm text-destructive">{message}</p></div>;
  }
    const ledgerHref = `/payments?billingMonth=${billingMonth}`;
    return <div className="space-y-6"><div><p className="text-sm font-medium text-muted-foreground">운영 현황</p><h1 className="text-2xl font-semibold tracking-tight">이번 달 수납과 업무</h1><p className="mt-1 text-sm text-muted-foreground">{billingMonth} 청구월 기준으로 집계됩니다.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="청구 금액" value={formatWon(summary.billedWon)} href={ledgerHref} description="초안·취소를 제외한 이번 달 확정 청구" />
        <MetricCard title="수납 금액" value={formatWon(summary.receivedWon)} href={ledgerHref} description="정상 영수증 배분 금액" />
        <MetricCard title="미수금" value={formatWon(summary.outstandingWon)} href={ledgerHref} description="수납 처리가 필요한 잔액" emphasis />
        <MetricCard title="연체 청구" value={`${summary.overdueCount}건`} href={ledgerHref} description={`승인 대기 ${summary.draftCount}건`} emphasis={summary.overdueCount > 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>오늘 처리할 수납 업무</CardTitle><CardDescription>청구 승인, 수납 등록, 영수증 정정은 모두 원장에서 추적됩니다.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><ActionLink href={ledgerHref} title="청구 확인" description={`${summary.draftCount}건 승인 대기`} /><ActionLink href={ledgerHref} title="수납 등록" description={`${formatWon(summary.outstandingWon)} 미수`} /><ActionLink href={ledgerHref} title="연체 검토" description={`${summary.overdueCount}건 조치 필요`} /></CardContent></Card><Card><CardHeader><CardTitle>운영 바로가기</CardTitle><CardDescription>수납과 독립된 현장 업무입니다.</CardDescription></CardHeader><CardContent className="space-y-2"><ActionLink href="/maintenance" title="유지보수" description="요청과 처리 현황" /><ActionLink href="/inspections" title="점검" description="예정된 현장 점검" /></CardContent></Card></div>
    </div>;
}

function MetricCard({ title, value, href, description, emphasis = false }: { title: string; value: string; href: string; description: string; emphasis?: boolean }) {
  return <Link href={href} className="block focus-visible:outline-none"><Card className="h-full transition-colors hover:bg-muted/50"><CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className={emphasis ? "text-3xl font-semibold text-destructive" : "text-3xl font-semibold"}>{value}</CardContent></Card></Link>;
}

function ActionLink({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link href={href} className="rounded-lg border p-3 transition-colors hover:bg-muted/50"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></Link>;
}
