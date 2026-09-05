import { expect, it } from "vitest";
import { reportCsv } from "./report-csv";

it("quotes delimiters, embedded quotes and neutralizes spreadsheet formulas", () => {
  expect(reportCsv([["자산", 'A,"B"', "=SUM(1,2)", " +cmd", 1200]])).toBe('\uFEFF"자산","A,""B""","\'=SUM(1,2)","\' +cmd","1200"');
});

it("keeps numeric amounts numeric in content and preserves Korean lines", () => {
  expect(reportCsv([["청구", "수납"], [100, 50]])).toBe('\uFEFF"청구","수납"\r\n"100","50"');
});
