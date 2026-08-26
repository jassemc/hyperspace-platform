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
