import type { CreateMembershipDto } from "@/lib/service/HsService"

export type SubscriptionInput = {
  companyId: string
  memberId?: string
  planId?: string
  startsAt?: string
  notes?: string
  billTo?: string
}

export type SubscriptionResult =
  | { ok: true; data: CreateMembershipDto }
  | { ok: false; error: string }

/**
 * The payload the company page's "Subscribe to plan" drawer sends.
 *
 * The company id used to be read off the form and then used ONLY to pick
 * what to revalidate — it never reached `POST /memberships` (#92 / C-02).
 * Every subscription made from a company's own page was therefore a
 * PERSONAL membership: `billTo: member`, no company, plan fee and deposit
 * charged to the employee, no company credit pool, and the API's
 * `membership_before_company_start` guard never fired because there was
 * no company to compare against. The bookkeeper found out at invoicing.
 *
 * Two shapes are legitimate, and the drawer now offers both:
 *  - member + company — that person's seat, billed to whoever `billTo`
 *    names (C-03);
 *  - company alone — a company-HELD membership, whose credits pool
 *    across every employee (C-02). The API distinguishes them by whether
 *    `memberId` is set, so this must not invent one.
 */
export function buildSubscriptionPayload(
  input: SubscriptionInput,
): SubscriptionResult {
  if (!input.companyId) return { ok: false, error: "Missing company" }
  if (!input.planId) return { ok: false, error: "Select a plan" }
  if (!input.startsAt) return { ok: false, error: "Start date is required" }

  const forCompanyItself = !input.memberId

  return {
    ok: true,
    data: {
      companyId: input.companyId,
      ...(input.memberId ? { memberId: input.memberId } : {}),
      planId: input.planId,
      startsAt: input.startsAt,
      ...(input.notes ? { notes: input.notes } : {}),
      // A company-held membership can only be billed to the company.
      // For a seat, staff choose; the API also defaults to company when
      // a companyId is present, but sending it keeps the drawer's
      // selection and the request in agreement.
      billTo:
        forCompanyItself || input.billTo !== "member" ? "company" : "member",
    },
  }
}
