"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Loader2, Search, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div><h1 className="text-3xl font-bold">{title}</h1><p className="mt-1 text-slate-400">{description}</p></div>
    <div className="flex flex-wrap gap-2">{actions}</div>
  </div>
}

export function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search..." className="border-slate-600 bg-slate-800 pl-9 text-white" />
  </div>
}

export function Loading() { return <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-blue-400" /></div> }
export function ErrorBox({ message }: { message: string }) { return <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">{message}</div> }
export const panel = "overflow-hidden rounded-xl border border-slate-700 bg-slate-800"
export const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
export const td = "px-4 py-3 align-top text-sm text-slate-200"

export function FileButton({ onFile, label = "Import CSV" }: { onFile: (file: File) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return <><input ref={ref} hidden type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" onClick={() => ref.current?.click()}><Upload className="mr-2 h-4 w-4" />{label}</Button></>
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" onClick={onClick}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
}

export function useDebounced(value: string, delay = 350) {
  const [result, setResult] = useState(value)
  useEffect(() => { const timer = setTimeout(() => setResult(value), delay); return () => clearTimeout(timer) }, [value, delay])
  return result
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a")
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
