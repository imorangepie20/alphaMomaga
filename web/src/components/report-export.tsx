"use client";
import { Button } from "./ui/button";
import { reportCsv } from "@/lib/report-csv";

export function ReportExport({ month, rows }: { month: string; rows: (string | number)[][] }) {
  function download() {
    const url = URL.createObjectURL(new Blob([reportCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rent-report-${month}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Button onClick={download} variant="outline">CSV 다운로드</Button>;
}
