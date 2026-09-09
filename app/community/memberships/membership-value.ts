import type { MembershipDiscountDto, MembershipDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { applyDiscount } from "@/lib/pricing/discount-math"
import { membershipSnapshot, type SnapshotExtra } from "./membership-snapshot"

/**
 * Pure: safe to import from client components. One definition of what a
 * membership bills per cycle, so the table cell and the details dialog
 * cannot drift apart.
 *
 * The snapshot keeps the plan and every extra at LIST price, with the
 * discount beside them; the API writes the reduction as separate negative
 * charge lines each cycle (percent → every line, amount off → the plan line
 * only). The figures here replay that arithmetic from the snapshot, so a
 * discounted membership no longer reads as if the discount were never
 * applied. Deposits and setup fees are one-off and stay out of it.
 */
export interface MembershipValue {
  /** The plan at list price; null when the snapshot has none. */
  planListHt: number | null
  /** What the discount takes off the plan line, as a negative number; 0 without one. */
  planDiscountHt: number
  /** What the discount takes off the extras, as a negative number; 0 without one. */
  extrasDiscountHt: number
  /** Everything the discount takes off per cycle, as a negative number. */
  discountHt: number
  /** The plan after its share of the discount; null when the snapshot has no price. */
  planHt: number | null
  extras: SnapshotExtra[]
  /** Extras at list price. */
  extrasHt: number
  /** Plan and extras after the discount. */
  totalHt: number
  discount: MembershipDiscountDto | null
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

export function membershipValue(membership: MembershipDto): MembershipValue {
  const snapshot = membershipSnapshot(membership)
  const planListHt = snapshot.plan?.priceHt ?? null
  const extras = snapshot.extras
  const extrasHt = round3(extras.reduce((sum, extra) => sum + extra.priceHt, 0))
  const discount = membership.discount ?? null

  let planDiscountHt = 0
  let extrasDiscountHt = 0
  if (discount) {
    // Same lines, same keys and same main line as the API's cycle charges.
    const lines = [
      { key: "plan", amountHt: planListHt ?? 0 },
      ...extras.map((extra) => ({ key: `extra:${extra.extraId}`, amountHt: extra.priceHt })),
    ]
    for (const reduced of applyDiscount(discount, lines, "plan")) {
      if (reduced.key === "plan") planDiscountHt += reduced.discountHt
      else extrasDiscountHt += reduced.discountHt
    }
    planDiscountHt = round3(planDiscountHt)
    extrasDiscountHt = round3(extrasDiscountHt)
  }
  const discountHt = round3(planDiscountHt + extrasDiscountHt)
  const planHt = planListHt === null ? null : round3(planListHt + planDiscountHt)

  return {
    planListHt,
    planDiscountHt,
    extrasDiscountHt,
    discountHt,
    planHt,
    extras,
    extrasHt,
    totalHt: round3((planListHt ?? 0) + extrasHt + discountHt),
    discount,
  }
}

/**
 * Says what the figure is made of, so a total nobody recognises can be traced
 * back to the list price, what the discount took off and the extras on top.
 * Null when the total is just the plan and there is nothing to explain.
 */
export function valueBreakdown({
  planListHt,
  discountHt,
  extras,
  extrasHt,
  discount,
}: MembershipValue): string | null {
  if (planListHt === null || (extras.length === 0 && !discount)) return null

  const off =
    discount && discountHt !== 0 ? ` − ${formatPriceHt(-discountHt)} (${discount.code})` : ""
  const addOns =
    extras.length > 0
      ? ` + ${extras.length} extra${extras.length > 1 ? "s" : ""} (${formatPriceHt(extrasHt)})`
      : ""
  return `${formatPriceHt(planListHt)} plan${addOns}${off}`
}
