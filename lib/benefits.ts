import { apiNumber, apiString } from "@/lib/api-value"
import { formatEnumLabel } from "@/lib/format"

/**
 * What a benefit needs to name itself.
 *
 * A catalog benefit (`PlanBenefitDto`) carries the resolved amenity and
 * resource-type names alongside their ids, so it can be labelled without
 * fetching those tables. The copies frozen into a membership's plan snapshot
 * carry the ids only — the names are read from the live catalog and the
 * snapshot is deliberately not. Both are accepted here, and a missing name
 * degrades to the benefit's own type rather than to nothing.
 */
export interface LabelledBenefit {
    benefitKind: string
    benefitType: string
    amount?: number | null
    renewal?: string | null
    resourceTypeName?: string | null
    amenityName?: string | null
}

/** Reads as "20 × half day per cycle — Meeting Room", or just "Locker". */
export function benefitLabel(benefit: LabelledBenefit): string {
    if (benefit.benefitKind === "amenity") {
        return apiString(benefit.amenityName) ?? formatEnumLabel(benefit.benefitType)
    }

    const amount = apiNumber(benefit.amount)
    const unit = formatEnumLabel(benefit.benefitType)
    const head = amount === null ? unit : `${amount} × ${unit}`
    const renewal = benefit.renewal === "per_cycle" ? " per cycle" : ""
    const scopeName = apiString(benefit.resourceTypeName)

    return scopeName ? `${head}${renewal} — ${scopeName}` : `${head}${renewal}`
}
