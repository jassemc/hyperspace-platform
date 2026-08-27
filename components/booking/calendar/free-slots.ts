import type { CalendarBlockDto } from "@/lib/service/HsService"

/**
 * Free-slot "ground": appearance only — the diagonal hatch and the
 * dashed bottom border that say "this is open," with no positioning or
 * interaction baked in. Safe to drop onto anything that just needs the
 * look, e.g. the legend swatch (calendar-legend.tsx), which sits in
 * normal flow and must NOT pick up the hover/focus states below — a
 * bare decorative swatch reacting to mouse-over previously recreated
 * the exact "looks clickable when it isn't" defect this file exists to
 * avoid on the real grid.
 */
export const FREE_SLOT_GROUND =
  "border-b border-dashed border-border/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-muted)_6px,var(--color-muted)_7px)]"

/**
 * The full interactive class for a real clickable free slot: FREE_SLOT_GROUND
 * above, plus the positioning that places it inside a relatively-positioned
 * grid column (`absolute inset-x-0`) and the interaction that makes it
 * behave like a slot — a hover state that swaps the hatch for a flat
 * accent fill, and a focus ring. Built FROM the ground rather than
 * repeating it, so the two can never drift apart; anything that only
 * wants the look (not the behaviour) should reach for FREE_SLOT_GROUND
 * instead of this.
 */
export const FREE_SLOT_CLASS = `group absolute inset-x-0 ${FREE_SLOT_GROUND} transition-colors hover:bg-accent hover:bg-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`

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
