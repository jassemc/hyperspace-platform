"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"

export function Section({
  title,
  aside,
  children,
}: Readonly<{ title: string; aside?: React.ReactNode; children: React.ReactNode }>) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function CopyId({ id, label }: Readonly<{ id: string; label?: string }>) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
      title={`Copy ${label ?? "ID"}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id)
          toast.success(`${label ?? "ID"} copied`)
        } catch {
          toast.error("Could not copy")
        }
      }}
    >
      {id}
      <Copy className="h-3 w-3" />
    </button>
  )
}
