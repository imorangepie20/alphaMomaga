"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BillingMutationError, generateBillingRun } from "@/lib/billing-client-mutation";

export function BillingRunAction({ billingMonth }: { billingMonth: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      await generateBillingRun(billingMonth);
      router.refresh();
    } catch (cause) {
      if (cause instanceof BillingMutationError && cause.status === 401) setError("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      else if (cause instanceof BillingMutationError && cause.status === 403) setError("청구 초안을 생성할 권한이 없습니다.");
      else setError("청구 초안을 생성하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-col items-end gap-2">
    <Button type="button" variant="outline" onClick={generate} disabled={pending}>
      {pending ? "생성 중..." : "청구 초안 생성"}
    </Button>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
