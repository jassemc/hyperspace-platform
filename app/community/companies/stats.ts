import { cache } from "react"
import { getListCompanies, getListMembers, getListMemberships } from "@/lib/service"
import { pageResult } from "@/lib/search-params"

export interface CompanyStats {
    companies: number
    members: number
    activeMemberships: number
    pendingMemberships: number
}

/**
 * `cache()` keys primitives by value and objects by reference, so this takes
 * no options object — the same call from the cards and any future caller
 * shares one set of requests per render.
 */
export const companyStats = cache(async (): Promise<CompanyStats | null> => {
    try {
        const [companies, members, activeMemberships, pendingMemberships] = await Promise.all([
            pageResult(await getListCompanies({ limit: 1, offset: 0, sort: "ASC" })).total,
            pageResult(await getListMembers({ limit: 1, offset: 0, sort: "ASC" })).total,
            pageResult(
                await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "active" })
            ).total,
            pageResult(
                await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "pending" })
            ).total,
        ])
        return { companies, members, activeMemberships, pendingMemberships }
    } catch (error) {
        console.warn("Failed to load company stats", error)
        return null
    }
})
