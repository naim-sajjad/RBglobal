"use client"

import { useCallback, useEffect, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "../../services/api"
import { deleteNewsletterSubscriber, exportNewsletterSubscribers, getNewsletterSubscribers, updateNewsletterSubscriberStatus, type NewsletterSubscriber } from "../../services/newsletterService"
import { ErrorBox, ExportButton, Loading, PageHeader, SearchBox, panel, saveBlob, td, th, useDebounced } from "../components"
import NewsletterImportDialog from "./NewsletterImportDialog"
import DeleteConfirmation from "../DeleteConfirmation"

export default function NewsletterPage() {
 const [items,setItems]=useState<NewsletterSubscriber[]>([]),[search,setSearch]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(true),[importOpen,setImportOpen]=useState(false); const query=useDebounced(search)
 const load=useCallback(async()=>{setLoading(true);try{setItems((await getNewsletterSubscribers({search:query,per_page:100})).data);setError("")}catch(e){setError(getErrorMessage(e))}finally{setLoading(false)}},[query])
 useEffect(()=>{void load()},[load])
 return <><PageHeader title="Newsletter subscribers" description="Manage website email subscribers and consent status." actions={<><Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" onClick={()=>setImportOpen(true)}><Upload className="mr-2 h-4 w-4"/>Import CSV</Button><ExportButton onClick={async()=>saveBlob(await exportNewsletterSubscribers({search:query}),"newsletter-subscribers.csv")}/></>}/><NewsletterImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={load}/><SearchBox value={search} onChange={setSearch}/>{error&&<div className="mt-4"><ErrorBox message={error}/></div>}
 <div className={`${panel} mt-4 overflow-x-auto`}>{loading?<Loading/>:<table className="w-full"><thead className="bg-slate-900/50"><tr>{["Name","Email","Type","Consent","Status","Subscribed","Actions"].map(x=><th className={th} key={x}>{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-700">{items.map(x=><tr key={x.id}><td className={td}>{x.name||"—"}</td><td className={td}>{x.email}</td><td className={td}>{x.subscriber_type||x.role||"—"}</td><td className={td}>{x.consent?"Yes":"No"}</td><td className={td}><select value={x.status} onChange={async e=>{await updateNewsletterSubscriberStatus(x.id,e.target.value as any);void load()}} className="cursor-pointer rounded bg-slate-700 p-2"><option>active</option><option>unsubscribed</option><option>blocked</option></select></td><td className={td}>{new Date(x.subscribed_at||x.created_at).toLocaleDateString()}</td><td className={td}><DeleteConfirmation itemName="subscriber" description={`Delete ${x.email} from newsletter subscribers? This cannot be undone.`} onDelete={async()=>{await deleteNewsletterSubscriber(x.id);await load()}} /></td></tr>)}</tbody></table>}</div></>
}
