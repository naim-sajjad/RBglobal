"use client"

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DeleteConfirmation({ itemName, description, onDelete }: {
  itemName: string
  description?: string
  onDelete: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const remove = async (event: React.MouseEvent) => {
    event.preventDefault()
    setDeleting(true)
    setError("")
    try {
      await onDelete()
      setOpen(false)
    } catch {
      setError("The item could not be deleted. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return <AlertDialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
    <AlertDialogTrigger asChild>
      <button type="button" className="inline-flex cursor-pointer items-center gap-1 text-red-400 transition-colors hover:text-red-300">
        <Trash2 className="h-4 w-4" />Delete
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent className="border-slate-700 bg-slate-900 text-white">
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
        <AlertDialogDescription className="text-slate-400">
          {description ?? `This ${itemName} will be permanently removed. This action cannot be undone.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {error && <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleting} className="cursor-pointer border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white">Cancel</AlertDialogCancel>
        <AlertDialogAction disabled={deleting} onClick={remove} className="cursor-pointer bg-red-600 text-white hover:bg-red-700">
          {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Yes, delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
