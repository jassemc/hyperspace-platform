import type { MemberKindHint, MemberStatus, MemberStatusUpdate } from "@/lib/service/HsService"

/**
 * `status` is derived by the API on read from the member's lifecycle. Staff can
 * pin it to `former` or `contact` via PUT /members/:id/status; `auto` clears the
 * pin and hands the value back to the derivation.
 */
export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
    lead: "Lead",
    "drop-in": "Drop-in",
    pending: "Pending",
    active: "Active",
    former: "Former",
    contact: "Contact",
}

export const MEMBER_STATUS_CLASSES: Record<MemberStatus, string> = {
    active: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200",
    lead: "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200",
    "drop-in": "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200",
    pending: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200",
    former: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200",
    contact: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200",
}

export const MEMBER_STATUS_VALUES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]

export const MEMBER_STATUS_TABS = MEMBER_STATUS_VALUES.map((value) => ({
    value,
    label: MEMBER_STATUS_LABELS[value],
}))

/** The values PUT /members/:id/status accepts. */
export const MEMBER_STATUS_OVERRIDE_OPTIONS: { value: MemberStatusUpdate; label: string; hint: string }[] = [
    { value: "auto", label: "Automatic", hint: "Derive from membership activity" },
    { value: "former", label: "Former", hint: "Pin as a past member" },
    { value: "contact", label: "Contact", hint: "Pin as a non-member contact" },
]

export const MEMBER_KIND_HINT_VALUES: MemberKindHint[] = ["lead", "visitor", "member"]

/**
 * These tabs filter by `kindHint`, a secondary filter alongside the status
 * tabs — `status`, though derived server-side, is filterable on the list
 * endpoint too.
 */
export const MEMBER_KIND_TABS = [
    { value: "lead", label: "Lead" },
    { value: "visitor", label: "Visitor" },
    { value: "member", label: "Member" },
]
