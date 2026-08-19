import type { InvoiceStatus } from "@/lib/service/HsService"

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    void: "Void",
}

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    void: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export const INVOICE_STATUS_VALUES = Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]

export const INVOICE_STATUS_TABS = INVOICE_STATUS_VALUES.map((value) => ({
    value,
    label: INVOICE_STATUS_LABELS[value],
}))
