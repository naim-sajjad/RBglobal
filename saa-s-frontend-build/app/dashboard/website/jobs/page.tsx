"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createJob, deleteJob, getAdminJobs, updateJobStatus, type JobPost } from "../../services/jobService"
import { getErrorMessage } from "../../services/api"
import { csvRows, saveCsv } from "../csv"
import { ErrorBox, ExportButton, FileButton, Loading, PageHeader, SearchBox, panel, td, th, useDebounced } from "../components"
import DeleteConfirmation from "../DeleteConfirmation"

export default function JobsPage() {
 const [items,setItems]=useState<JobPost[]>([]),[search,setSearch]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(true);const query=useDebounced(search)
 const load=useCallback(async()=>{setLoading(true);try{setItems((await getAdminJobs({search:query,per_page:100})).data);setError("")}catch(e){setError(getErrorMessage(e))}finally{setLoading(false)}},[query]);useEffect(()=>{void load()},[load])
 const importCsv=async(file:File)=>{try{const rows=csvRows(await file.text()),headers=rows.shift()?.map(x=>x.trim().toLowerCase())||[];let count=0;for(const row of rows){const val=(name:string)=>row[headers.indexOf(name)]||"";const form=new FormData();["title","slug","location","category","note","application_email","application_url","status","published_at"].forEach(k=>{const v=val(k);if(v)form.append(k,v)});form.append("status",val("status")||"draft");val("bullets").split("|").filter(Boolean).forEach(v=>form.append("bullets[]",v.trim()));await createJob(form);count++}setNotice(`${count} jobs imported.`);await load()}catch(e){setError(getErrorMessage(e))}}
 return <><PageHeader title="Jobs" description="Create and manage vacancies shown on the website." actions={<><Link href="/dashboard/website/jobs/new"><Button><Plus className="mr-2 h-4 w-4"/>Add new job</Button></Link><FileButton onFile={importCsv}/><ExportButton onClick={()=>saveCsv(["title","slug","location","category","bullets","note","application_email","application_url","status","published_at"],items.map(x=>[x.title,x.slug,x.location,x.category,x.bullets.join("|"),x.note,x.application_email,x.application_url,x.status,x.published_at]),"jobs.csv")}/></>}/><SearchBox value={search} onChange={setSearch}/>{notice&&<p className="mt-3 text-green-400">{notice}</p>}{error&&<div className="mt-4"><ErrorBox message={error}/></div>}
 <div className={`${panel} mt-4 overflow-x-auto`}>{loading?<Loading/>:<table className="w-full"><thead className="bg-slate-900/50"><tr>{["Title","Location","Category","Status","Published","Actions"].map(x=><th className={th} key={x}>{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-700">{items.map(x=><tr key={x.id}><td className={td}><b>{x.title}</b><div className="text-slate-500">{x.slug}</div></td><td className={td}>{x.location}</td><td className={td}>{x.category}</td><td className={td}><select value={x.status} onChange={async e=>{await updateJobStatus(x.id,e.target.value as any);void load()}} className="cursor-pointer rounded bg-slate-700 p-2"><option>draft</option><option>published</option><option>closed</option><option>archived</option></select></td><td className={td}>{x.published_at?new Date(x.published_at).toLocaleDateString():"—"}</td><td className={`${td} flex items-center gap-3`}><Link className="cursor-pointer text-blue-400 hover:text-blue-300" href={`/dashboard/website/jobs/${x.id}`}>Edit</Link><DeleteConfirmation itemName="job" description={`Delete “${x.title}”? It will be removed from the website and cannot be recovered.`} onDelete={async()=>{await deleteJob(x.id);await load()}} /></td></tr>)}</tbody></table>}</div></>
}
