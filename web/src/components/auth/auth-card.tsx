import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Brand mark */}
      <div className="flex justify-center">
        <Image
          src="/ChatGPT Image Sep 4, 2026, 11_49_33 AM.png"
          alt="Alpha Momega"
          width={48}
          height={48}
          className="size-12 object-contain"
          priority
        />
      </div>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
        {footer && (
          <CardFooter className="justify-center text-sm">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
import Image from "next/image"
