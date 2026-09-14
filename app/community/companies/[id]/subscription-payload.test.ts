import { describe, expect, it } from "vitest"
import { buildSubscriptionPayload } from "./subscription-payload"

const COMPANY = "d6661655-f6ed-4049-a474-b7713f9cb3ea"
const MEMBER = "11111111-2222-4333-8444-555555555555"
const PLAN = "068040bd-94f9-4a81-9c20-a4544fcca80b"

/**
 * #92 (C-02): the drawer read the company id off the form and used it
 * only to decide what to revalidate — it never reached POST /memberships,
 * so every subscription made from a company's own page was silently a
 * personal one.
 */
describe("buildSubscriptionPayload", () => {
  const base = { companyId: COMPANY, planId: PLAN, startsAt: "2026-10-01" }

  it("sends the company id — the whole point of the ticket", () => {
    const result = buildSubscriptionPayload({ ...base, memberId: MEMBER })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.companyId).toBe(COMPANY)
  })

  it("bills the company by default for an employee's seat", () => {
    const result = buildSubscriptionPayload({ ...base, memberId: MEMBER })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toMatchObject({
      companyId: COMPANY,
      memberId: MEMBER,
      billTo: "company",
    })
  })

  it("lets staff bill the member instead (C-03)", () => {
    const result = buildSubscriptionPayload({
      ...base,
      memberId: MEMBER,
      billTo: "member",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.billTo).toBe("member")
  })

  it("omits memberId entirely for a company-held membership", () => {
    // The API tells a pooled membership from a seat by whether memberId
    // is set, so an empty string or a null would change the meaning.
    const result = buildSubscriptionPayload({ ...base, memberId: "" })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect("memberId" in result.data).toBe(false)
    expect(result.data.billTo).toBe("company")
  })

  it("refuses to bill a company-held membership to a member", () => {
    const result = buildSubscriptionPayload({ ...base, billTo: "member" })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.billTo).toBe("company")
  })

  it("keeps notes when given and omits them when blank", () => {
    const withNotes = buildSubscriptionPayload({
      ...base,
      memberId: MEMBER,
      notes: "Renewal agreed by phone",
    })
    expect(withNotes.ok && withNotes.data.notes).toBe("Renewal agreed by phone")

    const without = buildSubscriptionPayload({ ...base, memberId: MEMBER })
    expect(without.ok && "notes" in without.data).toBe(false)
  })

  it("reports the missing field rather than posting a partial membership", () => {
    expect(buildSubscriptionPayload({ companyId: COMPANY, startsAt: "2026-10-01" })).toEqual({
      ok: false,
      error: "Select a plan",
    })
    expect(buildSubscriptionPayload({ companyId: COMPANY, planId: PLAN })).toEqual({
      ok: false,
      error: "Start date is required",
    })
    expect(buildSubscriptionPayload({ companyId: "", planId: PLAN, startsAt: "2026-10-01" })).toEqual({
      ok: false,
      error: "Missing company",
    })
  })
})
