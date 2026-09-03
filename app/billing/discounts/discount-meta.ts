import type { DiscountDto, DiscountKind } from "@/lib/service/HsService"
import { formatPriceHt, todayInTunis } from "@/lib/format"

export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = {
  plan: "Plan discount",
  resource_rate: "Resource rate discount",
}

export const DISCOUNT_KIND_HELP: Record<DiscountKind, string> = {
  plan: "Chosen per membership. Reduces the cycle fee (and plan extras) on every future, non-invoiced cycle.",
  resource_rate: "Attached to billing plans, or claimed by code at booking confirm. Every member on those plans — or anyone typing the code — pays less for the selected rates.",
}

export function formatDiscountValue(d: Pick<DiscountDto, "percentOff" | "amountOffHt">): string {
  if (d.percentOff !== null && d.percentOff !== undefined) return `${d.percentOff} %`
  if (d.amountOffHt !== null && d.amountOffHt !== undefined) return `${formatPriceHt(d.amountOffHt)} off`
  return "—"
}

/** Validity window, inclusive, YYYY-MM-DD compare (Africa/Tunis dates from the API). Any kind may carry one. */
export function isInWindow(
  d: Pick<DiscountDto, "validFrom" | "validUntil">,
  today = todayInTunis()
): boolean {
  return (!d.validFrom || d.validFrom <= today) && (!d.validUntil || d.validUntil >= today)
}

/**
 * Why a discount resolved by code cannot be picked at a booking, or null
 * once it turns out fine after all (the eligible list a caller already
 * fetched just hadn't caught up yet). Checked in this order because a
 * later reason can be true of a discount for which an earlier one is the
 * actual, more useful explanation — an archived resource-rate discount
 * outside its own window is still first and foremost archived.
 */
export function discountIneligibilityReason(
  d: Pick<DiscountDto, "status" | "kind" | "appliesToAll" | "resourceRateIds" | "validFrom" | "validUntil">,
  resourceRateIds: ReadonlySet<string>
): string | null {
  if (d.status === "archived") return "archived"
  if (d.kind !== "resource_rate") return "not a rate discount"
  if (!isInWindow(d)) return "expired or not yet valid"
  if (!d.appliesToAll && !d.resourceRateIds.some((id) => resourceRateIds.has(id))) {
    return "doesn't cover this room's rates"
  }
  return null
}
