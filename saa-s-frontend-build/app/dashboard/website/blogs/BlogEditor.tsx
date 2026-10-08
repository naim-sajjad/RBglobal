"use client"

import { useEffect, useRef, useState } from "react"
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, ImagePlus, Indent, Italic, Link2, List, ListOrdered, Maximize2, Minimize2, Outdent, Quote, Redo2, Underline, Undo2 } from "lucide-react"

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

function markdownToHtml(markdown: string) {
  const inline = (text: string) => escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  return markdown.split(/\n{2,}/).filter(Boolean).map(block => {
    const heading = block.match(/^(#{1,3})\s+([\s\S]*)$/)
    if (heading) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`
    const lines = block.split("\n")
    if (lines.every(line => /^(\d+\.|[-*])\s+/.test(line))) {
      const tag = /^\d+\./.test(lines[0]) ? "ol" : "ul"
      return `<${tag}>${lines.map(line => `<li>${inline(line.replace(/^(\d+\.|[-*])\s+/, ""))}</li>`).join("")}</${tag}>`
    }
    if (block.startsWith("> ")) return `<blockquote>${inline(block.slice(2))}</blockquote>`
    return `<p>${inline(block).replaceAll("\n", "<br>")}</p>`
  }).join("") || "<p><br></p>"
}

type Props = {
  value: string
  format?: string
  title: string
  excerpt?: string
  image?: string | null
  onChange: (content: string) => void
  label?: string
}

export default function BlogEditor({ value, format, title, excerpt, image, onChange, label = "Blog content" }: Props) {
  const editor = useRef<HTMLDivElement>(null)
  const selection = useRef<Range | null>(null)
  const lastValue = useRef<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [dialog, setDialog] = useState<"link" | "image" | null>(null)
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState("")
  const [active, setActive] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (editor.current && value !== lastValue.current) {
      editor.current.innerHTML = format === "html" ? value : markdownToHtml(value)
      lastValue.current = value
      selection.current = null
    }
  }, [value, format])

  useEffect(() => {
    if (!fullscreen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFullscreen(false) }
    document.addEventListener("keydown", close)
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", close) }
  }, [fullscreen])

  function rememberSelection() {
    const current = window.getSelection()
    if (current?.rangeCount && editor.current?.contains(current.anchorNode)) {
      selection.current = current.getRangeAt(0).cloneRange()
      setActive(Object.fromEntries(["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"].map(command => [command, document.queryCommandState(command)])))
    }
  }

  function sync() {
    if (!editor.current) return
    const html = editor.current.innerHTML
    lastValue.current = html
    onChange(editor.current.textContent?.trim() || editor.current.querySelector("img") ? html : "")
    rememberSelection()
  }

  function command(name: string, argument?: string) {
    editor.current?.focus()
    const current = window.getSelection()
    if (selection.current && current) {
      current.removeAllRanges()
      current.addRange(selection.current)
    }
    document.execCommand(name, false, argument)
    sync()
  }

  function insertUrl() {
    const address = url.trim()
    if (!/^(https?:\/\/\S+|\/(?!\/)[^\s\\]*)$/i.test(address)) {
      setUrlError("Enter an https:// URL or a path starting with /.")
      return
    }
    if (dialog === "image") command("insertImage", address)
    else if (selection.current?.toString()) command("createLink", address)
    else command("insertHTML", `<a href="${escapeHtml(address)}">${escapeHtml(address)}</a>`)
    setDialog(null)
    setUrl("")
    setUrlError("")
  }

  const tools = [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Underline", icon: Underline, command: "underline" },
    { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
    { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
    { label: "Align left", icon: AlignLeft, command: "justifyLeft" },
    { label: "Align center", icon: AlignCenter, command: "justifyCenter" },
    { label: "Align right", icon: AlignRight, command: "justifyRight" },
    { label: "Justify", icon: AlignJustify, command: "justifyFull" },
    { label: "Indent", icon: Indent, command: "indent" },
    { label: "Outdent", icon: Outdent, command: "outdent" },
    { label: "Quote", icon: Quote, command: "formatBlock", argument: "blockquote" },
    { label: "Code block", icon: Code, command: "formatBlock", argument: "pre" },
    { label: "Undo", icon: Undo2, command: "undo" },
    { label: "Redo", icon: Redo2, command: "redo" },
  ]
  const buttonClass = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-slate-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"

  return <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-slate-800" : "mt-2 overflow-hidden rounded-lg border border-slate-600"}>
    <div role="toolbar" aria-label="Article formatting" className="flex flex-wrap items-center gap-1 border-b border-slate-600 bg-slate-800 px-3 py-3 text-slate-100">
      <select aria-label="Paragraph style" defaultValue="p" onChange={event => command("formatBlock", event.target.value)} className="h-9 max-w-36 rounded border border-slate-600 bg-slate-800 px-2 text-sm">
        <option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
      </select>
      <select aria-label="Font size" defaultValue="3" onChange={event => command("fontSize", event.target.value)} className="mr-2 h-9 rounded border border-slate-600 bg-slate-800 px-2 text-sm">
        {[['1', '10'], ['2', '13'], ['3', '16'], ['4', '18'], ['5', '24'], ['6', '32'], ['7', '48']].map(([size, label]) => <option key={size} value={size}>{label}</option>)}
      </select>
      {tools.slice(0, 3).map(tool => <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} aria-pressed={!!active[tool.command]} onMouseDown={event => event.preventDefault()} onClick={() => command(tool.command)} className={`${buttonClass} ${active[tool.command] ? "bg-blue-600 text-white" : ""}`}><tool.icon size={18} /></button>)}
      <label title="Text color" className={`${buttonClass} relative cursor-pointer font-bold underline decoration-2 underline-offset-4`}>A<input aria-label="Text color" type="color" defaultValue="#ffffff" onChange={event => command("foreColor", event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>
      <label title="Highlight color" className={`${buttonClass} relative cursor-pointer`}><span className="rounded bg-blue-600 px-1 text-white">A</span><input aria-label="Highlight color" type="color" defaultValue="#2563eb" onChange={event => command("hiliteColor", event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>
      {[{ name: "link" as const, label: "Insert link", icon: Link2 }, { name: "image" as const, label: "Insert image", icon: ImagePlus }].map(tool => <button key={tool.name} type="button" title={tool.label} aria-label={tool.label} onMouseDown={event => event.preventDefault()} onClick={() => { rememberSelection(); setDialog(tool.name); setUrl(""); setUrlError("") }} className={buttonClass}><tool.icon size={18} /></button>)}
      {tools.slice(3).map(tool => <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} onMouseDown={event => event.preventDefault()} onClick={() => command(tool.command, tool.argument)} className={buttonClass}><tool.icon size={18} /></button>)}
      <button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen editor"} title={fullscreen ? "Exit fullscreen" : "Fullscreen editor"} onClick={() => setFullscreen(!fullscreen)} className={`${buttonClass} ml-auto`}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
    </div>
    {dialog && <div className="flex flex-wrap items-center gap-2 border-b border-slate-600 bg-slate-800 px-4 py-3 text-slate-100">
      <label className="text-sm" htmlFor="blog-editor-url">{dialog === "image" ? "Image URL" : "Link URL"}</label>
      <input id="blog-editor-url" autoFocus type="text" value={url} onChange={event => setUrl(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); insertUrl() } }} placeholder="https://" className="min-w-40 flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm" />
      <button type="button" onClick={insertUrl} className="rounded bg-blue-600 px-4 py-2 text-sm text-white">Insert</button>
      <button type="button" onClick={() => setDialog(null)} className="rounded border border-slate-600 px-4 py-2 text-sm">Cancel</button>
      {urlError && <p role="alert" className="w-full text-sm text-red-400">{urlError}</p>}
    </div>}
    <div className={`relative overflow-y-auto bg-slate-900 text-slate-100 ${fullscreen ? "flex-1" : "max-h-[760px] min-h-[480px]"}`}>
      <div className="mx-auto max-w-[980px] px-6 py-10 sm:px-10">
        <h2 className="mb-8 text-3xl font-normal leading-tight sm:text-4xl">{title || "Your article title"}</h2>
        {excerpt && <p className="mb-8 text-base leading-relaxed sm:text-lg">{excerpt}</p>}
        {image && <img src={image} alt={title || "Featured image"} className="mb-10 max-h-[480px] w-full object-cover" />}
        <div ref={editor} role="textbox" aria-label={label} aria-multiline="true" contentEditable suppressContentEditableWarning onInput={sync} onMouseUp={rememberSelection} onKeyUp={rememberSelection} onBlur={rememberSelection}
          onPaste={event => { event.preventDefault(); command("insertText", event.clipboardData.getData("text/plain")) }}
          onDrop={event => { event.preventDefault(); command("insertText", event.dataTransfer.getData("text/plain")) }}
          className="min-h-64 text-base leading-[1.8] outline-none [&_h1]:my-6 [&_h1]:text-4xl [&_h2]:my-6 [&_h2]:text-3xl [&_h3]:my-5 [&_h3]:text-2xl [&_p]:my-4 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-7 [&_ol]:pl-7 [&_a]:underline [&_img]:my-6 [&_img]:max-w-full [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-white/50 [&_blockquote]:pl-5 [&_pre]:whitespace-pre-wrap [&_pre]:rounded [&_pre]:bg-black/20 [&_pre]:p-4" />
      </div>
    </div>
    <div className="border-t border-slate-600 bg-slate-800 px-4 py-2 text-xs text-slate-400">Select text to format it. Save the form to keep your changes.</div>
  </div>
}
