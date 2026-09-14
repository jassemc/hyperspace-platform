import { describe, expect, it } from "vitest"
import { formatRelativeTime } from "./format"

/**
 * #87 (O-01): "which website requests came in over the weekend" is the
 * Monday-morning question, and it could not be answered from any list.
 * This is the coarse reading that goes beside the absolute time.
 */
describe("formatRelativeTime", () => {
  const now = new Date("2026-09-14T10:00:00Z")
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  const SECOND = 1000
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR

  it("collapses anything under a minute to 'just now'", () => {
    expect(formatRelativeTime(ago(5 * SECOND), now)).toBe("just now")
    expect(formatRelativeTime(ago(59 * SECOND), now)).toBe("just now")
  })

  it("counts minutes, then hours", () => {
    expect(formatRelativeTime(ago(2 * MINUTE), now)).toBe("2 min ago")
    expect(formatRelativeTime(ago(59 * MINUTE), now)).toBe("59 min ago")
    expect(formatRelativeTime(ago(2 * HOUR), now)).toBe("2 h ago")
    expect(formatRelativeTime(ago(23 * HOUR), now)).toBe("23 h ago")
  })

  it("names yesterday, then counts days — the weekend question", () => {
    expect(formatRelativeTime(ago(25 * HOUR), now)).toBe("yesterday")
    // Monday morning, looking back at Saturday.
    expect(formatRelativeTime(ago(2 * DAY), now)).toBe("2 d ago")
    expect(formatRelativeTime(ago(29 * DAY), now)).toBe("29 d ago")
  })

  it("falls back to months and years for old rows", () => {
    expect(formatRelativeTime(ago(60 * DAY), now)).toBe("2 mo ago")
    expect(formatRelativeTime(ago(400 * DAY), now)).toBe("1 y ago")
  })

  it("does not invent a future", () => {
    expect(formatRelativeTime(new Date(now.getTime() + HOUR).toISOString(), now)).toBe("just now")
  })

  it("renders a dash for a missing or unparseable value", () => {
    expect(formatRelativeTime(null, now)).toBe("-")
    expect(formatRelativeTime(undefined, now)).toBe("-")
    expect(formatRelativeTime("not a date", now)).toBe("-")
  })
})
