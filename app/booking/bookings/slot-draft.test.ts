import { describe, expect, it } from "vitest"
import { applyHalf, draftDurationMinutes } from "./slot-draft"

/**
 * #95 (S-05): changing the Start time used to blank the Ends at date —
 * reproduced in the browser on a 1 h booking by moving the start to the
 * end time, which for a 30-minute booking is the very next option in the
 * select. "Ends at" fell back to "Pick a date" and Update went disabled
 * on the first interaction.
 */
describe("applyHalf — moving the start carries the end", () => {
  const pair = { startsAt: "2027-02-10T10:00", endsAt: "2027-02-10T11:00" }

  it("shifts the end by the same delta, preserving the duration", () => {
    expect(applyHalf(pair, "startsAt", "2027-02-10T10:30")).toEqual({
      startsAt: "2027-02-10T10:30",
      endsAt: "2027-02-10T11:30",
    })
  })

  it("keeps a real range when the new start REACHES the old end", () => {
    // The exact case that used to blank it.
    expect(applyHalf(pair, "startsAt", "2027-02-10T11:00")).toEqual({
      startsAt: "2027-02-10T11:00",
      endsAt: "2027-02-10T12:00",
    })
  })

  it("keeps a real range when the new start passes the old end", () => {
    expect(applyHalf(pair, "startsAt", "2027-02-10T14:00")).toEqual({
      startsAt: "2027-02-10T14:00",
      endsAt: "2027-02-10T15:00",
    })
  })

  it("moves the end backwards too, when the start moves earlier", () => {
    expect(applyHalf(pair, "startsAt", "2027-02-10T08:00")).toEqual({
      startsAt: "2027-02-10T08:00",
      endsAt: "2027-02-10T09:00",
    })
  })

  it("carries the end across a day boundary rather than truncating", () => {
    const late = { startsAt: "2027-02-10T23:00", endsAt: "2027-02-10T23:30" }
    expect(applyHalf(late, "startsAt", "2027-02-10T23:45")).toEqual({
      startsAt: "2027-02-10T23:45",
      endsAt: "2027-02-11T00:15",
    })
  })

  it("moves the whole booking when the start DATE changes (N-08)", () => {
    expect(applyHalf(pair, "startsAt", "2027-02-11T10:00")).toEqual({
      startsAt: "2027-02-11T10:00",
      endsAt: "2027-02-11T11:00",
    })
  })
})

describe("applyHalf — the end half is the user's override", () => {
  const pair = { startsAt: "2027-02-10T10:00", endsAt: "2027-02-10T11:00" }

  it("extends the meeting without touching the start (N-07)", () => {
    expect(applyHalf(pair, "endsAt", "2027-02-10T11:30")).toEqual({
      startsAt: "2027-02-10T10:00",
      endsAt: "2027-02-10T11:30",
    })
  })

  it("lets the end be cleared on its own", () => {
    expect(applyHalf(pair, "endsAt", "")).toEqual({
      startsAt: "2027-02-10T10:00",
      endsAt: "",
    })
  })
})

describe("applyHalf — incomplete drafts", () => {
  it("collapses to null once both halves are empty", () => {
    expect(applyHalf({ startsAt: "2027-02-10T10:00", endsAt: "" }, "startsAt", "")).toBeNull()
    expect(applyHalf({ startsAt: "", endsAt: "2027-02-10T11:00" }, "endsAt", "")).toBeNull()
    expect(applyHalf(null, "startsAt", "")).toBeNull()
  })

  it("has no duration to carry when the end was never set", () => {
    expect(applyHalf({ startsAt: "2027-02-10T10:00", endsAt: "" }, "startsAt", "2027-02-10T12:00")).toEqual({
      startsAt: "2027-02-10T12:00",
      endsAt: "",
    })
  })

  it("drops an end the new start has reached when there is no duration to preserve", () => {
    // startsAt empty, so nothing to measure from: the old rule applies.
    expect(applyHalf({ startsAt: "", endsAt: "2027-02-10T10:00" }, "startsAt", "2027-02-10T10:00")).toEqual({
      startsAt: "2027-02-10T10:00",
      endsAt: "",
    })
  })

  it("starts a fresh draft from nothing", () => {
    expect(applyHalf(null, "startsAt", "2027-02-10T09:00")).toEqual({
      startsAt: "2027-02-10T09:00",
      endsAt: "",
    })
  })
})

describe("draftDurationMinutes", () => {
  it("measures a complete pair", () => {
    expect(
      draftDurationMinutes({ startsAt: "2027-02-10T10:00", endsAt: "2027-02-10T11:30" }),
    ).toBe(90)
  })

  it("is null for an incomplete or inverted pair", () => {
    expect(draftDurationMinutes(null)).toBeNull()
    expect(draftDurationMinutes({ startsAt: "2027-02-10T10:00", endsAt: "" })).toBeNull()
    expect(
      draftDurationMinutes({ startsAt: "2027-02-10T11:00", endsAt: "2027-02-10T10:00" }),
    ).toBeNull()
  })
})
