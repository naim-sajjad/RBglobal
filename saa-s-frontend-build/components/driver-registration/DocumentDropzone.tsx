'use client'

import React, { memo, useCallback, useState } from 'react'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  file: File | null
  onFileChange: (file: File | null) => void
  accept?: string
  required?: boolean
  hint?: string
}

export const DocumentDropzone = memo(function DocumentDropzone({
  label,
  file,
  onFileChange,
  accept = '.pdf,.jpg,.jpeg,.png',
  required = false,
  hint = 'PDF, JPG, PNG — max 5MB',
}: Props) {
  const [isDragging, setIsDragging] = useState(false)

  const onPick = useCallback(
    (files: FileList | null) => {
      const f = files?.[0]
      if (f) onFileChange(f)
    },
    [onFileChange],
  )

  return (
    <div className="space-y-2">
      <Label className="text-[#111827] font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            ;(e.currentTarget.querySelector('input[type=file]') as HTMLInputElement)?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          onPick(e.dataTransfer.files)
        }}
        className={cn(
          'relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-all duration-200',
          isDragging ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-300 bg-gray-50/80 hover:border-[#D4AF37]/60 hover:bg-white',
        )}
      >
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => onPick(e.target.files)}
          aria-label={label}
        />
        {file ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-8 w-8 shrink-0 text-emerald-600" />
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-[#111827]">{file.name}</p>
                <p className="text-xs text-emerald-600">Uploaded — tap to replace</p>
              </div>
            </div>
            <button
              type="button"
              className="relative z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onFileChange(null)
              }}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-10 w-10 text-gray-400" />
            <p className="text-center text-sm font-medium text-[#111827]">
              Drag & drop or click to upload
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">{hint}</p>
          </>
        )}
      </div>
    </div>
  )
})
