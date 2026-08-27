import type { CalendarBlockDto } from "@/lib/service/HsService"

/**
 * Free-slot "hatched ground": a diagonal hatch so an open half-hour reads
 * as available without hovering, giving way to a flat accent fill on
 * hover/focus. Shared by every grid that draws free slots over the same
 * slot-generation rules below (`freeSlotsFor`), so the affordance never
 * has to be re-derived per grid.
 */
export const FREE_SLOT_CLASS =
  "group absolute inset-x-0 border-b border-dashed border-border/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-muted)_6px,var(--color-muted)_7px)] transition-colors hover:bg-accent hover:bg-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

export interface FreeSlot {
  startMs: number
  endMs: number
}

/**
 * Free half-hour slots inside a resource's open windows for one day.
 *
 * Walks each window in `slotMin`-minute steps and keeps a slot only when
 * BOTH rules hold: (1) the resource's own minimum duration, started at
 * the slot, stays clear of the next booking, and (2) that same minimum
 * duration fits before the window closes. Offering anything else would
 * be a click that only errors server-side.
 */
export function freeSlotsFor(
  windows: { startMs: number; endMs: number }[],
  blocks: CalendarBlockDto[],
  minDurationMin: number,
  slotMin: number
): FreeSlot[] {
  const step = slotMin * 60_000
  const isBusy = (startMs: number, endMs: number) =>
    blocks.some(
      (b) => Date.parse(b.startsAt) < endMs && Date.parse(b.endsAt) > startMs
    )

  const slots: FreeSlot[] = []
  for (const w of windows) {
    for (let t = w.startMs; t + step <= w.endMs; t += step) {
      const prefillEnd = t + minDurationMin * 60_000
      if (!isBusy(t, prefillEnd) && prefillEnd <= w.endMs) {
        slots.push({ startMs: t, endMs: t + step })
      }
    }
  }
  return slots
}
