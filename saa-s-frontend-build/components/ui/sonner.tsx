'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme='dark'
      className='toaster group'
      position='top-right'
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-slate-800 group-[.toaster]:text-white group-[.toaster]:border-slate-600 group-[.toaster]:shadow-lg',
          title: 'group-[.toast]:text-white',
          description: 'group-[.toast]:text-slate-300',
          success:
            'group-[.toaster]:bg-emerald-950 group-[.toaster]:border-emerald-700 group-[.toaster]:text-emerald-50',
          error:
            'group-[.toaster]:bg-red-950 group-[.toaster]:border-red-700 group-[.toaster]:text-red-50',
          actionButton:
            'group-[.toast]:bg-emerald-600 group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-slate-700 group-[.toast]:text-slate-200',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
