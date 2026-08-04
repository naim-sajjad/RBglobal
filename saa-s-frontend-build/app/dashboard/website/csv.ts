export function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], value = "", quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"' && quoted && text[i + 1] === '"') { value += '"'; i++ }
    else if (c === '"') quoted = !quoted
    else if (c === "," && !quoted) { row.push(value); value = "" }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = ""
    } else value += c
  }
  row.push(value); if (row.some(Boolean)) rows.push(row)
  return rows
}
export function csvEscape(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"` }
export function saveCsv(headers: string[], rows: unknown[][], filename: string) {
  const content = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}
