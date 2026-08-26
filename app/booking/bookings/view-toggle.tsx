"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { CalendarDays, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Table is the default, so `view` is absent for it — the same
 * defaults-stay-out-of-the-URL rule the table's pagination follows
 * (data-table.tsx:218). Both views read the same params, so filters
 * survive the switch.
 */
export function ViewToggle() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const view = searchParams.get("view") === "calendar" ? "calendar" : "table"

  const select = (next: "table" | "calendar") => {
    if (next === view) return
    const params = new URLSearchParams(searchParams.toString())
    if (next === "calendar") {
      params.set("view", "calendar")
    } else {
      params.delete("view")
    }
    params.delete("page") // the calendar has no pages
    const query = params.toString()
    startTransition(() => router.replace(query ? `?${query}` : pathname))
  }

  return (
    <div
      className="inline-flex items-center rounded-md border p-0.5"
      role="group"
      aria-label="View"
    >
      {(
        [
          { value: "table", label: "Table", Icon: Table2 },
          { value: "calendar", label: "Calendar", Icon: CalendarDays },
        ] as const
      ).map(({ value, label, Icon }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          aria-pressed={view === value}
          onClick={() => select(value)}
          className={cn(
            "h-8 gap-2 px-3",
            view === value && "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
