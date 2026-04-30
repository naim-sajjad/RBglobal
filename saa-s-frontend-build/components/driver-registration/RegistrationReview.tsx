'use client'

import { format, isValid, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { formatCanadianPhoneDisplay } from '@/lib/phone-format'

type FormShape = {
  first_name: string
  middle_initial: string
  last_name: string
  gender: string
  date_of_birth: string
  email: string
  cell_phone: string
  education: string
  current_address: string
  current_address_living_since: string
  previous_addresses: Array<{
    address: string
    from_date: string
    to_date: string
  }>
  city: string
  province: string
  postal_code: string
  license_number: string
  license_type: string
  license_other: string
}

type Props = {
  data: FormShape
  onEditSection: (section: number) => void
}

const genderLabel = (g: string) => {
  const map: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    non_binary: 'Non-binary',
    prefer_not_to_say: 'Prefer not to say',
  }
  return map[g] || g || '—'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-gray-500 sm:w-1/3">{label}</span>
      <span className="text-sm text-[#111827] sm:flex-1 sm:text-right">{value || '—'}</span>
    </div>
  )
}

export function RegistrationReview({ data, onEditSection }: Props) {
  const name = `${data.first_name} ${data.middle_initial ? data.middle_initial + '. ' : ''}${data.last_name}`.trim()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
        <p className="font-semibold">You&apos;re ready to submit</p>
        <p className="mt-1 text-emerald-800/90">
          Review the summary below. Use <strong>Edit</strong> to jump back to any section — your answers stay saved.
        </p>
      </div>

      <section className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#111827]">Personal</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 border-gray-300"
            onClick={() => onEditSection(1)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <Row label="Full name" value={name} />
        <Row label="Gender" value={genderLabel(data.gender)} />
        <Row label="Date of birth" value={data.date_of_birth} />
        <Row label="Phone" value={formatCanadianPhoneDisplay(data.cell_phone) || data.cell_phone} />
        <Row label="Email" value={data.email} />
        {data.education ? <Row label="Education" value={data.education} /> : null}
      </section>

      <section className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#111827]">Address</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 border-gray-300"
            onClick={() => onEditSection(2)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <Row label="Street" value={data.current_address} />
        <Row
          label="Living since / time period"
          value={
            data.current_address_living_since &&
            isValid(parseISO(data.current_address_living_since))
              ? format(parseISO(data.current_address_living_since), 'MMM d, yyyy')
              : data.current_address_living_since
          }
        />
        <Row
          label="City, Province, Postal"
          value={`${data.city}, ${data.province} ${data.postal_code}`.trim()}
        />
        {data.previous_addresses.some((p) => p.address.trim()) ? (
          <div className="border-t border-gray-100 pt-2 mt-1">
            <span className="text-xs font-medium text-gray-500">
              Previous addresses (last 3 years)
            </span>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#111827]">
              {data.previous_addresses
                .filter((p) => p.address.trim())
                .map((p, i) => (
                  <li key={i}>
                    <span className="font-medium">{p.address.trim()}</span>
                    {p.from_date.trim() && p.to_date.trim() ? (
                      <span className="text-gray-600">
                        {' '}
                        —{' '}
                        {isValid(parseISO(p.from_date)) &&
                        isValid(parseISO(p.to_date))
                          ? `${format(parseISO(p.from_date), 'MMM d, yyyy')} – ${format(
                              parseISO(p.to_date),
                              'MMM d, yyyy',
                            )}`
                          : `${p.from_date} – ${p.to_date}`}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#111827]">License</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 border-gray-300"
            onClick={() => onEditSection(3)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <Row label="License number" value={data.license_number} />
        <Row
          label="License type"
          value={data.license_type === 'Other' && data.license_other ? data.license_other : data.license_type}
        />
      </section>
    </div>
  )
}
