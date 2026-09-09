import type {
    OpportunityDto,
    OpportunityInterest,
    OpportunityStage,
    OpportunityStatsDto,
    RequestedExtraDto,
} from "@/lib/service/HsService"
import { apiNumber } from "@/lib/api-value"
import { formatPriceHt } from "@/lib/format"
import { changeIn } from "@/lib/stats"

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

/**
 * Won is reached by converting the lead into a membership, never by editing
 * the stage: setting it by hand stamps closed_at and the onboarding endpoint
 * then refuses the opportunity for good.
 */
export const OPPORTUNITY_STAGE_EDITABLE_VALUES = OPPORTUNITY_STAGE_VALUES.filter(
    (value) => value !== "won"
)

export const OPPORTUNITY_STAGE_TABS = OPPORTUNITY_STAGE_VALUES.map((value) => ({
    value,
    label: OPPORTUNITY_STAGE_LABELS[value],
}))

export const OPPORTUNITY_INTEREST_LABELS: Record<OpportunityInterest, string> = {
    coworking: "Coworking",
    domiciliation: "Domiciliation",
    private_office: "Private office",
    meeting_room: "Meeting room",
    free_day: "Free trial day",
    other: "Other",
}

export const OPPORTUNITY_INTEREST_VALUES = Object.keys(
    OPPORTUNITY_INTEREST_LABELS
) as OpportunityInterest[]

export interface OpportunityValue {
    /** The fee actually quoted, else the plan's own price; null for neither. */
    planFee: number | null
    extras: RequestedExtraDto[]
    extrasTotal: number
    /** What the deal is worth, or null when there is nothing to add up. */
    total: number | null
}

/**
 * One definition of what a lead is worth, so the table cell and the details
 * dialog cannot drift apart. The API's own `expectedValue` wins when it has
 * one; otherwise it is the quoted plan fee plus the add-ons billing with it.
 */
export function opportunityValue(opportunity: OpportunityDto): OpportunityValue {
    const extras = opportunity.requestedExtras ?? []
    const extrasTotal = extras.reduce((sum, extra) => sum + extra.priceHt, 0)
    const planFee =
        apiNumber(opportunity.requestedPlanPriceHt) ??
        opportunity.requestedPlan?.priceHt ??
        null
    const reported = apiNumber(opportunity.expectedValue)
    const nothingToSum = planFee === null && extras.length === 0

    return {
        planFee,
        extras,
        extrasTotal,
        total: reported ?? (nothingToSum ? null : (planFee ?? 0) + extrasTotal),
    }
}

/**
 * Says what the figure is made of, so a total nobody recognises can be traced
 * back to the plan fee and the add-ons that make it up.
 */
export function valueBreakdown({ planFee, extras, extrasTotal }: OpportunityValue): string | null {
    if (planFee === null) return null
    const addOns =
        extras.length > 0
            ? ` + ${extras.length} add-on${extras.length > 1 ? "s" : ""} (${formatPriceHt(extrasTotal)})`
            : ""
    return `${formatPriceHt(planFee)} plan${addOns}`
}

/** Won is money made, lost is money gone; neither is still in play. */
const CLOSED_STAGES: OpportunityStage[] = ["won", "lost"]

export interface OpportunityTotals {
    total: number
    open: number
    won: number
    lost: number
    /** Expected value of everything not yet closed. */
    pipelineHt: number
    /** Reached a tour or a quote: the deals worth chasing this week. */
    engaged: number
    /** Value riding on those late-stage deals. */
    engagedHt: number
    /** Won against everything closed, as a percentage; null before any close. */
    winRate: number | null
    /** The stage holding the most open leads, with its count. */
    busiestOpen: { stage: OpportunityStage; count: number } | null
    /** The last eight weeks, oldest first. */
    weeks: { week: string; created: number; won: number; lost: number }[]
    /** Change from the week before last to last week, as a signed percentage. */
    changeIn: (key: "created" | "won") => number | undefined
    countFor: (stage: OpportunityStage) => number
}

/**
 * Every figure on the screen comes from the per-stage rows the API returns,
 * so the tabs and the cards can never disagree.
 */
export function opportunityTotals(
    stats: OpportunityStatsDto | null | undefined
): OpportunityTotals {
    const rows = stats?.byStage ?? []
    const counts = new Map(rows.map((row) => [row.stage, row.count]))

    const total = rows.reduce((sum, row) => sum + row.count, 0)
    const won = counts.get("won") ?? 0
    const lost = counts.get("lost") ?? 0

    const openRows = rows.filter((row) => !CLOSED_STAGES.includes(row.stage))
    const lateRows = rows.filter(
        (row) => row.stage === "tour" || row.stage === "quote"
    )
    const closed = won + lost
    const busiest = openRows
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count)[0]

    const weeks = stats?.byWeek ?? []

    return {
        total,
        won,
        lost,
        weeks,
        changeIn: (key: "created" | "won") => changeIn(weeks, key),
        open: total - won - lost,
        pipelineHt: openRows.reduce((sum, row) => sum + row.expectedValue, 0),
        engaged: lateRows.reduce((sum, row) => sum + row.count, 0),
        engagedHt: lateRows.reduce((sum, row) => sum + row.expectedValue, 0),
        winRate: closed === 0 ? null : Math.round((won / closed) * 100),
        busiestOpen: busiest
            ? { stage: busiest.stage, count: busiest.count }
            : null,
        countFor: (stage) => counts.get(stage) ?? 0,
    }
}
