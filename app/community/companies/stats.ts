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
        const companiesRequest = getListCompanies({ limit: 1, offset: 0, sort: "ASC" })
        const membersRequest = getListMembers({ limit: 1, offset: 0, sort: "ASC" })
        const activeMembershipsRequest = getListMemberships({
            limit: 1,
            offset: 0,
            sort: "ASC",
            status: "active",
        })
        const pendingMembershipsRequest = getListMemberships({
            limit: 1,
            offset: 0,
            sort: "ASC",
            status: "pending",
        })
        const [companiesResult, membersResult, activeMembershipsResult, pendingMembershipsResult] =
            await Promise.all([
                companiesRequest,
                membersRequest,
                activeMembershipsRequest,
                pendingMembershipsRequest,
            ])
        return {
            companies: pageResult(companiesResult).total,
            members: pageResult(membersResult).total,
            activeMemberships: pageResult(activeMembershipsResult).total,
            pendingMemberships: pageResult(pendingMembershipsResult).total,
        }
    } catch (error) {
        console.warn("Failed to load company stats", error)
        return null
    }
})
