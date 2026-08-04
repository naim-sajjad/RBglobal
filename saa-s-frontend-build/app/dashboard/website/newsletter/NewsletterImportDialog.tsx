"use client"

import { useRef, useState } from "react"
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getErrorMessage } from "../../services/api"
import { importNewsletterSubscribers, previewNewsletterImport, type NewsletterImportMode, type NewsletterImportPreview, type NewsletterImportResult } from "../../services/newsletterService"

export default function NewsletterImportDialog({ open, onOpenChange, onImported }: {
  open: boolean; onOpenChange: (open: boolean) => void; onImported: () => Promise<void> | void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<NewsletterImportPreview | null>(null)
  const [result, setResult] = useState<NewsletterImportResult | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("")
  const [mode, setMode] = useState<NewsletterImportMode>("skip_duplicates")
  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(""); setLoading(false); setMode("skip_duplicates") }
  const close = () => { if (!loading) { onOpenChange(false); reset() } }
  const selectFile = async (selected: File) => {
    setFile(selected); setPreview(null); setResult(null); setError(""); setLoading(true)
    try { setPreview(await previewNewsletterImport(selected)) } catch(e) { setError(getErrorMessage(e)) } finally { setLoading(false) }
  }
  const runImport = async () => {
    if (!file) return
    setLoading(true); setError("")
    try { const response = await importNewsletterSubscribers(file, mode); setResult(response.data); await onImported() }
    catch(e) { setError(getErrorMessage(e)) } finally { setLoading(false) }
  }
  return <Dialog open={open} onOpenChange={(next) => { if (!loading) { onOpenChange(next); if (!next) reset() } }}>
    <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-xl">
      <DialogHeader><DialogTitle>Import newsletter subscribers</DialogTitle><DialogDescription className="text-slate-400">Upload the four-column subscriber CSV. Checked rows become active; unchecked rows remain non-consented.</DialogDescription></DialogHeader>
      {!result && <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)void selectFile(f)}} onClick={()=>!loading&&input.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/60 p-8 text-center hover:border-blue-500">
        <input ref={input} hidden type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0]&&void selectFile(e.target.files[0])}/>
        {loading?<Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-400"/>:file?<FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-green-400"/>:<UploadCloud className="mx-auto mb-3 h-10 w-10 text-blue-400"/>}
        <p className="font-medium">{loading?"Checking CSV...":file?file.name:"Drop your CSV here or click to browse"}</p><p className="mt-1 text-xs text-slate-400">CSV or TXT, maximum 10 MB</p>
      </div>}
      {preview&&!result&&<><div className={`rounded-lg border p-4 ${preview.headers_valid?"border-green-800 bg-green-950/30":"border-red-800 bg-red-950/30"}`}><p className="font-medium">{preview.headers_valid?"File is ready to import":"CSV columns do not match"}</p><p className="mt-1 text-sm text-slate-400">{preview.sample_rows.length} sample rows checked · {preview.active_rows} checked · {preview.non_consented_rows} unchecked</p></div>
      <label className="text-sm">When an email already exists<select value={mode} onChange={e=>setMode(e.target.value as NewsletterImportMode)} className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 p-2.5"><option value="skip_duplicates">Skip duplicate</option><option value="update_empty_fields">Fill missing subscriber information</option><option value="reactivate_consented">Reactivate if CSV consent is checked</option></select></label></>}
      {result&&<div className="rounded-xl border border-green-800 bg-green-950/30 p-6 text-center"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-400"/><p className="text-lg font-semibold">Import completed</p><div className="mt-4 grid grid-cols-4 gap-2 text-sm"><div><b className="block text-xl">{result.imported_rows}</b>Imported</div><div><b className="block text-xl">{result.duplicate_rows}</b>Duplicates</div><div><b className="block text-xl">{result.active_rows}</b>Active</div><div><b className="block text-xl">{result.failed_rows}</b>Failed</div></div></div>}
      {error&&<div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}
      <DialogFooter className="gap-2"><Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" disabled={loading} onClick={close}>{result?"Close":"Cancel"}</Button>{!result&&<Button disabled={!file||loading||!preview?.headers_valid} onClick={()=>void runImport()}>{loading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Please wait...</>:<><UploadCloud className="mr-2 h-4 w-4"/>Import subscribers</>}</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>
}
