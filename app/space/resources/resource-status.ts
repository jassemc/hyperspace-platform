import type { ResourceStatus } from "@/lib/service/HsService"

/**
 * `status` is derived by the API at read time from the resource's own
 * occupancy plus its parent chain and children, so it is display-only.
 */
export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
    available: "Available",
    reserved: "Reserved",
    partially_occupied: "Partially occupied",
    occupied: "Occupied",
    unavailable: "Unavailable",
}

export const RESOURCE_STATUS_CLASSES: Record<ResourceStatus, string> = {
    available: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200",
    reserved: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200",
    partially_occupied: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200",
    occupied: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200",
    unavailable: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200",
}

export const RESOURCE_STATUS_VALUES = Object.keys(RESOURCE_STATUS_LABELS) as ResourceStatus[]

export const RESOURCE_STATUS_TABS = RESOURCE_STATUS_VALUES.map((value) => ({
    value,
    label: RESOURCE_STATUS_LABELS[value],
}))

export function isResourceStatus(value: string | undefined): value is ResourceStatus {
    return !!value && (RESOURCE_STATUS_VALUES as string[]).includes(value)
}
