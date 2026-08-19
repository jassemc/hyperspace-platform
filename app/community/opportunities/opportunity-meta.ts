import type { OpportunityInterest, OpportunityStage } from "@/lib/service/HsService"

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
    new: "New",
    contacted: "Contacted",
    tour: "Tour",
    quote: "Quote",
    won: "Won",
    lost: "Lost",
}

export const OPPORTUNITY_STAGE_CLASSES: Record<OpportunityStage, string> = {
    new: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
    contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    tour: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    quote: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    won: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export const OPPORTUNITY_STAGE_VALUES = Object.keys(OPPORTUNITY_STAGE_LABELS) as OpportunityStage[]

export const OPPORTUNITY_STAGE_TABS = OPPORTUNITY_STAGE_VALUES.map((value) => ({
    value,
    label: OPPORTUNITY_STAGE_LABELS[value],
}))

export const OPPORTUNITY_INTEREST_LABELS: Record<OpportunityInterest, string> = {
    coworking: "Coworking",
    domiciliation: "Domiciliation",
    private_office: "Private office",
    meeting_room: "Meeting room",
    other: "Other",
}

export const OPPORTUNITY_INTEREST_VALUES = Object.keys(
    OPPORTUNITY_INTEREST_LABELS
) as OpportunityInterest[]
