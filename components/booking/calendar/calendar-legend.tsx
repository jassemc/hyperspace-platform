"use client"

import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { cn } from "@/lib/utils"
import { FREE_SLOT_GROUND } from "./free-slots"

/**
 * A key for the grid. Two block styles and two ground states is two more
 * than a reader can be expected to infer, and "pending" in particular
 * carries a rule — it does not hold the slot — that nothing else states.
 *
 * The "Free" swatch reuses FREE_SLOT_GROUND — the look only, not
 * FREE_SLOT_CLASS's positioning/hover/focus — because this box sits in
 * normal flow, not inside a positioned grid column, and is a bare
 * aria-hidden `<span>`: it has no click handler, so a real hover state
 * would fire on mouseover regardless, recreating the exact "looks
 * clickable when it isn't" defect the swatch exists to avoid. A flat
 * approximation was tried first and rejected for the opposite reason —
 * it read identically to the non-clickable open-window ground, teaching
 * a reader the wrong thing about what "clickable" looks like.
 *
 * Border: FREE_SLOT_GROUND's `border-dashed`/`border-{color}` are not
 * side-scoped, so combined with the shared `border` below they render a
 * uniform dashed border on all four sides (Tailwind resolves border
 * style through one shared --tw-border-style custom property, not
 * per-side) — the same construction Pending's dashed swatch uses, so
 * the two read as one consistent "dashed" family rather than a
 * mismatched partial edge.
 */
export function CalendarLegend() {
  const items: { label: string; className: string }[] = [
    { label: "Confirmed", className: BOOKING_BLOCK_STYLES.confirmed },
    { label: "Pending (does not hold the slot)", className: BOOKING_BLOCK_STYLES.pending },
    { label: "Free — click to book", className: FREE_SLOT_GROUND },
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
