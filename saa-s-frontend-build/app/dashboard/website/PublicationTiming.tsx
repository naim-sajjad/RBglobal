"use client"

import { Input } from "@/components/ui/input"

export default function PublicationTiming({ mode, onModeChange, value, onChange }: {
  mode: "immediate" | "scheduled"
  onModeChange: (mode: "immediate" | "scheduled") => void
  value: string
  onChange: (value: string) => void
}) {
  return <div className="space-y-4">
    <div role="radiogroup" aria-label="Publication timing" className="flex flex-wrap gap-5 text-sm">
      <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="publication_timing" checked={mode === "immediate"} onChange={() => onModeChange("immediate")} className="accent-blue-500" />Publish immediately</label>
      <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="publication_timing" checked={mode === "scheduled"} onChange={() => onModeChange("scheduled")} className="accent-blue-500" />Schedule publication</label>
    </div>
    {mode === "scheduled" && <label className="block max-w-md text-sm">Publish date and time *<Input required type="datetime-local" value={value} onChange={event => onChange(event.target.value)} className="mt-2 border-slate-600 bg-slate-900 text-slate-100" /><p className="mt-2 text-xs text-slate-400">Choose a future date and time in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p></label>}
  </div>
}
