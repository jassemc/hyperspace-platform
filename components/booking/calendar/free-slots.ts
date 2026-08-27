import type { CalendarBlockDto } from "@/lib/service/HsService"

/**
 * Closed/unavailable time — outside the location's (or resource's) day
 * limits. Hatched, because that is the scheduler convention for "cannot
 * book here": darker border-colour lines over the muted ground, so it
 * cannot be read as the clean open background bookable time sits on.
 * The hatch used to mean the opposite (it marked FREE slots); it moved
 * here deliberately, and free slots went plain — two hatches with two
 * meanings would have been ambiguous, and hatched-closed is the idiom
 * every other calendar teaches.
 */
export const CLOSED_GROUND =
  "bg-muted/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-border)_6px,var(--color-border)_7px)]"

/**
 * Free-slot "ground": appearance only — the dashed separator that
 * divides bookable half-hours, sitting on the clean open background
 * (the contrast against CLOSED_GROUND's hatch is what says "open").
 * No positioning or interaction baked in: safe for the legend swatch
 * (calendar-legend.tsx), which sits in normal flow and must NOT pick up
 * the hover/focus states below — a bare decorative swatch reacting to
 * mouse-over previously recreated the exact "looks clickable when it
 * isn't" defect this file exists to avoid on the real grid.
 */
export const FREE_SLOT_GROUND = "border-b border-dashed border-border/60"

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
