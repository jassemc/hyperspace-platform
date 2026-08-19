import type { MembershipStatus } from "@/lib/service/HsService"

/** Derived from the membership's dates on every read, so it is display-only. */
export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
    pending: "Pending",
    active: "Active",
    paused: "Paused",
    ended: "Ended",
}

export const MEMBERSHIP_STATUS_CLASSES: Record<MembershipStatus, string> = {
    pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    paused: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export const MEMBERSHIP_STATUS_VALUES = Object.keys(MEMBERSHIP_STATUS_LABELS) as MembershipStatus[]

export const MEMBERSHIP_STATUS_TABS = MEMBERSHIP_STATUS_VALUES.map((value) => ({
    value,
    label: MEMBERSHIP_STATUS_LABELS[value],
}))
