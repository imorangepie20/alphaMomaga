export function reportCsv(rows: (string | number)[][]): string {
  return "\uFEFF" + rows.map((row) => row.map((value) => {
    const text = String(value);
    const safe = typeof value === "string" && /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
}
