import Image from "next/image"

export function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string
  /** "dark" = on dark/navy backgrounds (wraps in white card), "light" = on white backgrounds */
  variant?: "dark" | "light"
}) {
  return (
    <a href="/" aria-label="R&B Services Plus Inc. — Home" className={`inline-flex items-center ${className}`}>
      <span
        className={`flex items-center justify-center overflow-hidden rounded-xl ${
          variant === "dark" ? "bg-white p-1.5 shadow-sm ring-1 ring-black/5" : ""
        }`}
      >
        <Image
          src="/rb-logo.avif"
          alt="R&B Services Plus Inc. — Your Human Resources Partner"
          width={40}
          height={70}
          priority
          className="h-20 w-auto object-contain"
        />
      </span>
    </a>
  )
}


