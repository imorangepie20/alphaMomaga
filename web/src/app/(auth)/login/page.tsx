import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Continue securely with your organization account."
      footer={
        <span className="text-muted-foreground">
          Need access?{" "}
          <Link href="mailto:admin@approid.team" className="font-medium text-foreground underline-offset-4 hover:underline">
            Contact an administrator
          </Link>
        </span>
      }
    >
      <Link
        href="/auth/login"
        className="flex h-9 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Continue with Auth0
      </Link>
    </AuthCard>
  )
}
