"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function label(segment: string) {
  const labels: Record<string, string> = {
    dashboard: "대시보드",
    "real-estate": "부동산 관리",
    properties: "매물",
    tenants: "임차인",
    contracts: "계약",
    payments: "수납",
    maintenance: "유지보수",
    inspections: "점검",
    admin: "관리자",
    users: "사용자",
    roles: "역할",
    reports: "보고서",
    settings: "설정",
  };
  if (labels[segment]) return labels[segment];
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;
          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label(seg)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label(seg)}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
