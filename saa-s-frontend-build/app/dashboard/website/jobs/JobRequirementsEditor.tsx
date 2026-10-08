"use client"

import { useEffect, useRef, useState } from "react"
import { Bold, Italic, Underline, Undo2, Redo2, List, RemoveFormatting } from "lucide-react"

function inlineHtml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

function serialize(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ""
  const text = Array.from(node.childNodes).map(serialize).join("")
  const tag = node instanceof HTMLElement ? node.tagName : ""
  if (tag === "B" || tag === "STRONG") return text ? `**${text}**` : ""
  if (tag === "I" || tag === "EM") return text ? `*${text}*` : ""
  if (tag === "U") return text ? `__${text}__` : ""
  return tag === "BR" ? "\n" : text
}

export default function JobRequirementsEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null)
  const lastValue = useRef<string | null>(null)
  const selection = useRef<Range | null>(null)
  const [active, setActive] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (editor.current && value !== lastValue.current) {
      editor.current.innerHTML = `<ul>${(value ? value.split("\n") : [""]).map(line => `<li>${inlineHtml(line) || "<br>"}</li>`).join("")}</ul>`
      lastValue.current = value
      selection.current = null
    }
  }, [value])

  function remember() {
    const current = window.getSelection()
    if (current?.rangeCount && editor.current?.contains(current.anchorNode)) {
      selection.current = current.getRangeAt(0).cloneRange()
      setActive(Object.fromEntries(["bold", "italic", "underline"].map(command => [command, document.queryCommandState(command)])))
    }
  }

  function sync() {
    if (!editor.current) return
    const lines: string[] = []
    const collect = (node: Node) => {
      if (node instanceof HTMLElement && ["UL", "OL"].includes(node.tagName)) node.childNodes.forEach(collect)
      else lines.push(serialize(node))
    }
    editor.current.childNodes.forEach(collect)
    const next = lines.join("\n")
    lastValue.current = next
    onChange(next)
    remember()
  }

  function command(name: string, value?: string) {
    editor.current?.focus()
    const current = window.getSelection()
    if (selection.current && current) {
      current.removeAllRanges()
      current.addRange(selection.current)
    }
    document.execCommand(name, false, value)
    sync()
  }

  const tools = [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Underline", icon: Underline, command: "underline" },
    { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
    { label: "Clear formatting", icon: RemoveFormatting, command: "removeFormat" },
    { label: "Undo", icon: Undo2, command: "undo" },
    { label: "Redo", icon: Redo2, command: "redo" },
  ]

  return <div className="mt-1 overflow-hidden rounded-md border border-slate-600">
    <div role="toolbar" aria-label="Job requirements formatting" className="flex flex-wrap gap-1 border-b border-slate-600 bg-slate-800 p-2">
      {tools.map(tool => <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} aria-pressed={active[tool.command] || false} onMouseDown={event => event.preventDefault()} onClick={() => command(tool.command)} className={`flex h-9 w-9 items-center justify-center rounded text-slate-100 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${active[tool.command] ? "bg-blue-600" : ""}`}><tool.icon size={17} /></button>)}
    </div>
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Job requirements" aria-multiline="true" onInput={sync} onMouseUp={remember} onKeyUp={remember} onBlur={remember}
      onPaste={event => { event.preventDefault(); command("insertText", event.clipboardData.getData("text/plain")) }}
      onDrop={event => { event.preventDefault(); command("insertText", event.dataTransfer.getData("text/plain")) }}
      className="min-h-44 bg-slate-900 p-4 text-base leading-7 text-slate-100 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:pl-1 [&_div]:min-h-7" />
    <p className="border-t border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-400">Press Enter for a new requirement. Select text to format it.</p>
  </div>
}
