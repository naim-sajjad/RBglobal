import Image from "next/image"

export function Logo({
  className = "",
  imageClassName = "h-20 w-auto object-contain object-left",
  variant = "dark",
}: {
  className?: string
  imageClassName?: string
  /** "dark" = on dark/navy backgrounds (wraps in white card), "light" = on white backgrounds */
  variant?: "dark" | "light"
}) {
  return (
    <a href="/" aria-label="R&B Services Plus Inc. — Home" className={`inline-flex items-center self-start ${className}`}>
      <span
        className={`flex items-center justify-start overflow-hidden rounded-xl ${
          variant === "dark" ? "bg-white p-1.5 shadow-sm ring-1 ring-black/5" : ""
        }`}
      >
        <Image
          src="/rb-logo.avif"
          alt="R&B Services Plus Inc. — Your Human Resources Partner"
          width={160}
          height={80}
          priority
          className={imageClassName}
        />
      </span>
    </a>
  )
}


