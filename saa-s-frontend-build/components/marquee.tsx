const items = [
  "Office & Accounting",
  "Industrial & Warehousing",
  "Trucking",
  "General Labour",
  "Information Technology",
  "Skilled Trades",
]

export function Marquee() {
  return (
    <div className="border-y border-border bg-brand py-4 text-white">
      <div className="flex overflow-hidden">
        <div className="flex shrink-0 animate-marquee items-center">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center gap-6 whitespace-nowrap px-6">
              <span className="text-sm font-medium tracking-wide text-white/80">{item}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-glow)]" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
