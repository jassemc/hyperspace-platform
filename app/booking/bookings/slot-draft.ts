/**
 * The manual "Starts at" / "Ends at" pair in the booking edit dialog.
 *
 * Both halves are wall-clock strings ("YYYY-MM-DDTHH:mm") in the
 * location's zone — the server action converts to UTC on submit (see
 * actions.ts:toUtcIso), so nothing here may consult a timezone.
 */
export type SlotDraft = { startsAt: string; endsAt: string }

const MINUTE = 60_000

/** Wall-clock string → epoch ms, read as UTC so no zone is implied. */
function toMs(wallClock: string): number {
  return new Date(`${wallClock}:00Z`).getTime()
}

/** Epoch ms → wall-clock string, the inverse of toMs. */
function toWall(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16)
}

/**
 * Apply one half of the pair.
 *
 * Moving the START carries the END with it, preserving the booking's
 * duration (#95 / S-05). Before this, changing the start merely blanked
 * an end the new start had reached or passed — which for a 30-minute
 * booking is the very next option in the time select, so "Ends at" fell
 * back to "Pick a date" and Update went disabled on the first
 * interaction. Extending a meeting by half an hour (N-07) or moving it
 * by a day (N-08) are the desk's two most common edits; both start by
 * touching the start.
 *
 * The user can still override the end afterwards — editing the END half
 * never moves the start.
 *
 * Returns `null` once both halves are empty, so a cleared pair collapses
 * instead of lingering as an object of two empty strings.
 */
export function applyHalf(
  current: SlotDraft | null,
  half: "startsAt" | "endsAt",
  next: string,
): SlotDraft | null {
  if (half === "endsAt") {
    const startsAt = current?.startsAt ?? ""
    return startsAt || next ? { startsAt, endsAt: next } : null
  }

  const previousStart = current?.startsAt ?? ""
  const previousEnd = current?.endsAt ?? ""

  // A complete previous pair has a duration worth preserving.
  if (next && previousStart && previousEnd) {
    const duration = toMs(previousEnd) - toMs(previousStart)
    if (duration > 0) {
      return { startsAt: next, endsAt: toWall(toMs(next) + duration) }
    }
  }

  // No duration to carry (the end was never set, or the stored pair was
  // degenerate): keep the end only while it still leaves a real range.
  // An end at or before the new start is a zero-or-negative duration the
  // server would refuse anyway.
  const endsAt = previousEnd && previousEnd > next ? previousEnd : ""
  return next || endsAt ? { startsAt: next, endsAt } : null
}

/** Minutes between the two halves, for the duration hint. */
export function draftDurationMinutes(draft: SlotDraft | null): number | null {
  if (!draft?.startsAt || !draft.endsAt) return null
  const minutes = (toMs(draft.endsAt) - toMs(draft.startsAt)) / MINUTE
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
}
