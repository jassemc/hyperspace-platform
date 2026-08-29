import type { DiscountDto, DiscountKind } from "@/lib/service/HsService"
import { formatPriceHt, todayInTunis } from "@/lib/format"

export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = {
  plan: "Plan discount",
  resource_rate: "Resource rate discount",
  promo: "Promo code",
}

export const DISCOUNT_KIND_HELP: Record<DiscountKind, string> = {
  plan: "Chosen per membership. Reduces the cycle fee (and plan extras) on every future, non-invoiced cycle.",
  resource_rate: "Attached to billing plans. Every member on those plans pays less for the selected rates.",
  promo: "A code visitors type on the website. Applies to every public booking and plan request.",
}

export function formatDiscountValue(d: Pick<DiscountDto, "percentOff" | "amountOffHt">): string {
  if (d.percentOff !== null && d.percentOff !== undefined) return `${d.percentOff} %`
  if (d.amountOffHt !== null && d.amountOffHt !== undefined) return `${formatPriceHt(d.amountOffHt)} off`
  return "—"
}

/** Promo validity, inclusive, YYYY-MM-DD compare (Africa/Tunis dates from the API). */
export function isInWindow(
  d: Pick<DiscountDto, "validFrom" | "validUntil">,
  today = todayInTunis()
): boolean {
  return (!d.validFrom || d.validFrom <= today) && (!d.validUntil || d.validUntil >= today)
}
