"use client"

import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { cn } from "@/lib/utils"
import { FREE_SLOT_CLASS } from "./free-slots"

/**
 * A key for the grid. Two block styles and two ground states is two more
 * than a reader can be expected to infer, and "pending" in particular
 * carries a rule — it does not hold the slot — that nothing else states.
 *
 * The "Free" swatch reuses FREE_SLOT_CLASS itself (with `static` in
 * place of the grid's `absolute`, since this box sits in normal flow,
 * not inside a positioned column) rather than a flat approximation —
 * flat would read identically to the non-clickable open-window ground,
 * teaching a reader the wrong thing about what "clickable" looks like.
 */
export function CalendarLegend() {
  const items: { label: string; className: string }[] = [
    { label: "Confirmed", className: BOOKING_BLOCK_STYLES.confirmed },
    { label: "Pending (does not hold the slot)", className: BOOKING_BLOCK_STYLES.pending },
    { label: "Free — click to book", className: cn(FREE_SLOT_CLASS, "static") },
    { label: "Closed", className: "border-transparent bg-muted/40" },
  ]

  return (
    <ul className="mx-4 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("h-3 w-5 shrink-0 rounded-sm border", item.className)}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
