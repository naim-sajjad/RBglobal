import Image from "next/image"

export function SiteLoader() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-200"
      role="status"
      aria-live="polite"
      aria-label="Loading website"
    >
      <div className="absolute inset-0">
        <img
          src="/hero-logistics.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-50/90 to-gray-200/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-transparent to-white/80" />
      </div>

      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[var(--accent-glow)] opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/5 h-64 w-64 rounded-full bg-[var(--brand-light)] opacity-15 blur-[120px]" />

      <div className="relative flex flex-col items-center gap-6 px-6">
        <Image
          src="/rb-logo.avif"
          alt="R&B Services Plus Inc."
          width={200}
          height={100}
          priority
          className="h-16 w-auto object-contain sm:h-20"
        />

        <div className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-[3px] border-gray-200" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[var(--accent-glow)] border-r-[var(--brand)]" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-gray-800">
            R&amp;B Services Plus Inc.
          </p>
          <p className="mt-1 text-xs text-gray-500">Connecting talent with opportunity</p>
        </div>
      </div>
    </div>
  )
}
