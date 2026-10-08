export function JobRequirement({ text }: { text: string }) {
  return <span>{text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith("__") && part.endsWith("__")) return <u key={index}>{part.slice(2, -2)}</u>
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })}</span>
}
