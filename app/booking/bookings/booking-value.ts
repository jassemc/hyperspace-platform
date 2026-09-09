import type { BookingDiscountDto, BookingDto, QuoteExtraDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"

/**
 * Pure: safe to import from client components. One definition of what a
 * booking costs, so the table cell and the details dialog cannot drift apart.
 *
 * The API stores the room NET of its discount (`priceHt`) and the list
 * price it started from (`roomListHt`), so the amount taken off is the
 * difference. A PENDING booking is the exception: its snapshot is only
 * applied at confirm, so both figures are list and the reduction is an
 * estimate from the snapshot's rate.
 */
export interface BookingValue {
  /** The room at list price; null when credits cover it. */
  roomListHt: number | null
  /** What the discount takes off the room, as a negative number; 0 without one. */
  discountHt: number
  /** The room after the discount; null when credits cover it. */
  roomHt: number | null
  /** A NULL price on a paid booking means credits cover the room. */
  creditCovered: boolean
  extras: QuoteExtraDto[]
  extrasHt: number
  extrasTtc: number
  /** Room after discount plus extras; 0 when nothing is charged. */
  totalHt: number
  discount: BookingDiscountDto | null
  /** The discount is stored but the API only applies it at confirm. */
  discountPending: boolean
}

const toMillimes = (amount: number) => Math.round(amount * 1000) / 1000

/** What the snapshot would take off `listHt`, mirroring the API's rounding to millimes. */
function estimateReduction(discount: BookingDiscountDto, listHt: number): number {
  if (discount.percentOff !== null && discount.percentOff !== undefined) {
    return -toMillimes((listHt * discount.percentOff) / 100)
  }
  if (discount.amountOffHt !== null && discount.amountOffHt !== undefined) {
    return -Math.min(discount.amountOffHt, listHt)
  }
  return 0
}

/** The list price a net figure came from, for rows the API priced before it kept the list. */
function listFromNet(discount: BookingDiscountDto, netHt: number): number {
  if (discount.percentOff !== null && discount.percentOff !== undefined) {
    return discount.percentOff >= 100 ? netHt : toMillimes(netHt / (1 - discount.percentOff / 100))
  }
  if (discount.amountOffHt !== null && discount.amountOffHt !== undefined) {
    return netHt + discount.amountOffHt
  }
  return netHt
}

export function bookingValue(booking: BookingDto): BookingValue {
  const extras = booking.extras ?? []
  const extrasHt = extras.reduce((sum, extra) => sum + extra.priceHt, 0)
  const discount = booking.discount ?? null
  const storedHt = booking.priceHt ?? null
  const creditCovered = !booking.isFree && storedHt === null
  const discountPending = discount !== null && booking.status === "pending"

  const hasList = booking.roomListHt !== null && booking.roomListHt !== undefined
  let roomListHt = booking.roomListHt ?? storedHt
  let discountHt = 0
  if (discount && storedHt !== null) {
    if (discountPending) {
      // Stored at list; the API applies the snapshot at confirm.
      discountHt = estimateReduction(discount, storedHt)
    } else if (hasList) {
      discountHt = storedHt - (roomListHt as number)
    } else {
      // Priced before the API kept the list: stored is net, work back.
      roomListHt = listFromNet(discount, storedHt)
      discountHt = storedHt - roomListHt
    }
  }
  const roomHt = storedHt === null ? null : discountPending ? storedHt + discountHt : storedHt

  return {
    roomListHt,
    discountHt,
    roomHt,
    creditCovered,
    extras,
    extrasHt,
    extrasTtc: extras.reduce((sum, extra) => sum + extra.totalTtc, 0),
    totalHt: (roomHt ?? 0) + extrasHt,
    discount,
    discountPending,
  }
}

/**
 * Says what the figure is made of, so a total nobody recognises can be traced
 * back to the list price, what the discount took off and the extras on top.
 * Null when the total is just the room and there is nothing to explain.
 */
export function valueBreakdown({
  roomListHt,
  discountHt,
  creditCovered,
  extras,
  extrasHt,
  discount,
}: BookingValue): string | null {
  if (extras.length === 0 && !discount) return null

  const room = creditCovered ? "room on credits" : formatPriceHt(roomListHt)
  const off =
    discount && discountHt !== 0 ? ` − ${formatPriceHt(-discountHt)} (${discount.code})` : ""
  const addOns =
    extras.length > 0
      ? ` + ${extras.length} extra${extras.length > 1 ? "s" : ""} (${formatPriceHt(extrasHt)})`
      : ""
  return `${room}${off}${addOns}`
}
