import type { BookingSource, BookingStatus } from "@/lib/service/HsService"

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    no_show: "No show",
}

export const BOOKING_STATUS_CLASSES: Record<BookingStatus, string> = {
    pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    no_show: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export const BOOKING_STATUS_VALUES = Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]

export const BOOKING_STATUS_TABS = BOOKING_STATUS_VALUES.map((value) => ({
    value,
    label: BOOKING_STATUS_LABELS[value],
}))

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
    portal: "Member portal",
    staff: "Staff",
    public: "Website",
}

export const BOOKING_SOURCE_VALUES = Object.keys(
    BOOKING_SOURCE_LABELS
) as BookingSource[]

/**
 * How a booking is drawn ON THE CALENDAR — distinct from
 * BOOKING_STATUS_CLASSES, which styles a table badge.
 *
 * Confirmed sits on the primary token rather than the emerald both grids
 * used to hardcode; nothing in globals.css ever issued that green.
 *
 * Pending keeps a DASHED border, and that is not decoration: a pending
 * request does not hold the slot (the exclusion constraint is scoped to
 * confirmed rows), which is why several may legitimately overlap and why
 * the grids lane them side by side. Encoding that in hue alone would
 * lose it for anyone who cannot separate the two.
 */
export const BOOKING_BLOCK_STYLES: Record<BookingStatus, string> = {
    confirmed: "border-primary/30 bg-primary/10 text-foreground",
    pending: "border-dashed border-amber-500/60 bg-amber-500/10 text-foreground",
    cancelled: "border-border bg-muted text-muted-foreground line-through",
    no_show: "border-border border-dashed bg-muted text-muted-foreground",
}
