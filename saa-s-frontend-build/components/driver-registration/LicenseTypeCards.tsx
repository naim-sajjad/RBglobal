'use client'

import { memo } from 'react'
import { Car, Truck, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPES: { value: string; label: string; Icon: typeof Car }[] = [
  { value: 'AZ', label: 'AZ', Icon: Truck },
  { value: 'DZ', label: 'DZ', Icon: Truck },
  { value: 'G-Class', label: 'G-Class', Icon: Car },
  { value: 'G1/G2', label: 'G1 / G2', Icon: Car },
  { value: 'Other', label: 'Other', Icon: CircleDot },
]

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export const LicenseTypeCards = memo(function LicenseTypeCards({
  value,
  onChange,
  className,
}: Props) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5', className)}>
      {TYPES.map(({ value: v, label, Icon }) => {
        const selected = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 transition-all duration-200',
              selected
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]/25'
                : 'border-gray-200 bg-white hover:border-[#D4AF37]/50',
            )}
          >
            <Icon className={cn('h-7 w-7', selected ? 'text-[#111827]' : 'text-gray-500')} />
            <span className="text-sm font-semibold text-[#111827]">{label}</span>
          </button>
        )
      })}
    </div>
  )
})
