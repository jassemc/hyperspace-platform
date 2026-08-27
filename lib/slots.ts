/**
 * Free-slot maths. Windows are wall-clock strings ("08:00") in the
 * location's timezone; busy intervals are UTC instants. Everything is
 * normalised to UTC milliseconds here.
 *
 * Ported from public-booking-page/lib/slots.ts. That copy closes over a
 * BUSINESS_TZ constant, which is fine for a site serving one region and
 * wrong for an admin serving many — so every function here takes the
 * zone as an argument instead.
 */

export interface Slot {
    /** ISO instant. */
    startUtc: string
    endUtc: string
}

export interface FreeRange {
    startMs: number
    endMs: number
}

export interface DayWindows {
    date: string
    windows: { open: string; close: string }[]
}

export interface BusyInterval {
    startsAt: string
    endsAt: string
}

/** UTC offset (ms) of `timeZone` at a given instant. */
function tzOffsetMs(atUtcMs: number, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(new Date(atUtcMs))

    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
    const asUtc = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour") === 24 ? 0 : get("hour"),
        get("minute"),
        get("second"),
    )
    return asUtc - atUtcMs
}

/**
 * A wall-clock time on a date, in `timeZone`, as a UTC instant.
 *
 * Two passes: the offset is read at the naive instant, then re-read at
 * the corrected one. A single pass is wrong on DST transition days, and
 * silently so — the slot simply lands an hour out.
 */
export function wallClockToUtcMs(date: string, hhmm: string, timeZone: string): number {
    const [h, m] = hhmm.split(":").map(Number)
    const naive = Date.UTC(
        Number(date.slice(0, 4)),
        Number(date.slice(5, 7)) - 1,
        Number(date.slice(8, 10)),
        h,
        m,
    )
    const guess = naive - tzOffsetMs(naive, timeZone)
    return naive - tzOffsetMs(guess, timeZone)
}

/**
 * The inverse: a UTC instant as "YYYY-MM-DDTHH:mm" in `timeZone`.
 *
 * Assembled from `formatToParts` rather than a formatted string glued
 * together: an earlier version relied on `sv-SE` emitting a plain space
 * between date and time and replaced it with "T" — a locale's separator
 * is an ICU implementation detail, not a contract (`en-US`'s AM/PM
 * separator changed under us once already). If it silently changed here,
 * `.replace` would no-op, the value would come out without a "T", and
 * `value.startsAt.split("T")` would hand `undefined` to
 * `wallClockToUtcMs`, which throws on `.split(":")`.
 *
 * One definition, deliberately: the booking dialog and the slot picker
 * both produce these strings and then COMPARE them, to decide whether a
 * window actually moved. Two implementations that disagree by a single
 * character would make every metadata edit post a window and re-price
 * the booking.
 */
export function toWallClock(iso: string, timeZone: string): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(iso))
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

/** A day's open windows, minus busy intervals and minus the past. */
export function freeRangesForDay(
    day: DayWindows,
    busy: BusyInterval[],
    nowMs: number,
    timeZone: string,
): FreeRange[] {
    let ranges: FreeRange[] = day.windows.map((w) => ({
        startMs: wallClockToUtcMs(day.date, w.open, timeZone),
        endMs: wallClockToUtcMs(day.date, w.close, timeZone),
    }))

    const sorted = busy
        .map((b) => ({ startMs: Date.parse(b.startsAt), endMs: Date.parse(b.endsAt) }))
        .sort((a, b) => a.startMs - b.startMs)

    for (const b of sorted) {
        ranges = ranges.flatMap((r) => {
            if (b.endMs <= r.startMs || b.startMs >= r.endMs) return [r]
            const pieces: FreeRange[] = []
            if (b.startMs > r.startMs) pieces.push({ startMs: r.startMs, endMs: b.startMs })
            if (b.endMs < r.endMs) pieces.push({ startMs: b.endMs, endMs: r.endMs })
            return pieces
        })
    }

    return ranges
        .map((r) => ({ startMs: Math.max(r.startMs, nowMs), endMs: r.endMs }))
        .filter((r) => r.endMs > r.startMs)
}

const STEP_MIN = 30

/** Bookable starts on a 30-minute grid that still fit `durationMin`. */
export function startOptionsForDuration(ranges: FreeRange[], durationMin: number): Slot[] {
    const out: Slot[] = []
    const step = STEP_MIN * 60_000
    const dur = durationMin * 60_000
    for (const r of ranges) {
        let t = Math.ceil(r.startMs / step) * step
        if (t < r.startMs) t = r.startMs
        for (; t + dur <= r.endMs; t += step) {
            out.push({
                startUtc: new Date(t).toISOString(),
                endUtc: new Date(t + dur).toISOString(),
            })
        }
    }
    return out
}

/** Duration choices between the resource's bounds, on sensible steps. */
export function durationChoices(minMin: number | null, maxMin: number | null): number[] {
    const min = minMin ?? 60
    const max = maxMin ?? 480
    const out: number[] = []
    for (let d = min; d <= max; d += d < 120 ? 30 : 60) out.push(d)
    if (out[out.length - 1] !== max) out.push(max)
    return out
}
