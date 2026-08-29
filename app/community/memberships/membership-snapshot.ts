import type { MembershipDto } from "@/lib/service/HsService"
import type { LabelledBenefit } from "@/lib/benefits"

/**
 * `planSnapshot` is generated as an open `Record<string, any>`, but the API
 * writes a stable shape: the plan's commercial terms, the extras chosen at
 * creation, the benefits, and when the copy was taken.
 *
 * This is the contract the membership actually runs on — the catalog plan it
 * points at may since have been repriced or archived, and none of that reaches
 * a membership already sold. Every field is optional on purpose: a membership
 * written before a field existed still has to render.
 */
export interface SnapshotPlan {
    name?: string | null
    code?: string | null
    kind?: string | null
    priceHt?: number | null
    vatRate?: number | null
    deposit?: number | null
    cycleMonths?: number | null
    cancellationDays?: number | null
    /**
     * The discount snapshotted alongside the plan, if the membership was
     * created (or later updated) with one. Optional-chain every read —
     * older snapshots predate this field.
     */
    discount?: {
        code?: string | null
        percentOff?: number | null
        amountOffHt?: number | null
    } | null
}

export interface SnapshotExtra {
    extraId: string
    name: string
    priceHt: number
    vatRate: number
    deposit?: number | null
}

export interface MembershipSnapshot {
    plan: SnapshotPlan | null
    extras: SnapshotExtra[]
    /** Frozen copies, so these carry ids where the catalog carries names. */
    benefits: LabelledBenefit[]
    snapshotAt: string | null
}

/** Reads the snapshot defensively — anything absent comes back empty, not undefined. */
export function membershipSnapshot(membership: MembershipDto): MembershipSnapshot {
    const raw = (membership.planSnapshot ?? {}) as Record<string, unknown>
    const plan = raw.plan

    return {
        plan: plan && typeof plan === "object" ? (plan as SnapshotPlan) : null,
        extras: Array.isArray(raw.extras) ? (raw.extras as SnapshotExtra[]) : [],
        benefits: Array.isArray(raw.benefits) ? (raw.benefits as LabelledBenefit[]) : [],
        snapshotAt: typeof raw.snapshotAt === "string" ? raw.snapshotAt : null,
    }
}

/** "Monthly", "Every 3 months", or nothing when the plan is not recurring. */
export function billingCycleLabel(plan: SnapshotPlan | null): string | null {
    const months = plan?.cycleMonths
    if (months === null || months === undefined) return null
    if (months === 1) return "Monthly"
    return `Every ${months} months`
}
