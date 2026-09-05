import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

export default function RegisterPage() {
  return <AuthCard
    title="회원가입"
    description="계정 생성 후 관리자가 업무 역할을 부여할 때까지 승인 대기 화면이 표시됩니다."
    footer={<Link href="/login" className="underline underline-offset-4">이미 계정이 있나요? 로그인</Link>}
  >
    <a href="/auth/login?screen_hint=signup&returnTo=%2Fpending-approval" className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">Auth0에서 안전하게 회원가입</a>
  </AuthCard>;
}
