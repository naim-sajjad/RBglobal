import Image from "next/image"

export function Logo({
  className = "",
  imageClassName = "block h-20 w-auto object-contain object-left",
  variant = "dark",
}: {
  className?: string
  imageClassName?: string
  /** "dark" = on dark/navy backgrounds (wraps in white card), "light" = on white backgrounds */
  variant?: "dark" | "light"
}) {
  const image = (
    <Image
      src="/rb-logo-trim.avif"
      alt="R&B Services Plus Inc. — Your Human Resources Partner"
      width={188}
      height={130}
      priority
      className={imageClassName}
    />
  )

  return (
    <a
      href="/"
      aria-label="R&B Services Plus Inc. — Home"
      className={`flex w-fit shrink-0 items-center justify-start ${className}`}
    >
      {variant === "dark" ? (
        <span className="flex items-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
          {image}
        </span>
      ) : (
        image
      )}
    </a>
  )
}
