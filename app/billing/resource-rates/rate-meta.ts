import type { BookingMode, RateIntervalType } from "@/lib/service/HsService"

export const RATE_INTERVAL_LABELS: Record<RateIntervalType, string> = {
    once: "One-off",
    hour: "Per hour",
    half_day: "Per half day",
    day: "Per day",
    week: "Per week",
    month: "Per month",
}

/**
 * Intervals must fit the resource type's booking mode: hourly types price by
 * once/hour/half_day/day, daily types by once/day/week/month. A type that is
 * not time-bookable can still carry a flat one-off price.
 */
export const INTERVALS_BY_BOOKING_MODE: Record<BookingMode, RateIntervalType[]> = {
    hourly: ["once", "hour", "half_day", "day"],
    daily: ["once", "day", "week", "month"],
    none: ["once"],
}

/** Weekend variants override the standard rate, and only for these intervals. */
const WEEKEND_CAPABLE_INTERVALS: RateIntervalType[] = ["hour", "half_day", "day"]

export function supportsWeekendVariant(interval: RateIntervalType): boolean {
    return WEEKEND_CAPABLE_INTERVALS.includes(interval)
}
