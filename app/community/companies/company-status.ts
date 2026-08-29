import type { CompanyStatus } from "@/lib/service/HsService"

/**
 * Derived on read from the company's memberships; display-only, the list
 * has no status filter.
 */
export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
    lead: "Lead",
    "drop-in": "Drop-in",
    pending: "Pending",
    active: "Active",
    former: "Former",
    inactive: "Inactive",
}

export const COMPANY_STATUS_CLASSES: Record<CompanyStatus, string> = {
    active: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200",
    lead: "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200",
    "drop-in": "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200",
    pending: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200",
    former: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export const COMPANY_STATUS_VALUES = Object.keys(COMPANY_STATUS_LABELS) as CompanyStatus[]

export const COMPANY_STATUS_TABS = COMPANY_STATUS_VALUES.map((value) => ({
    value,
    label: COMPANY_STATUS_LABELS[value],
}))
