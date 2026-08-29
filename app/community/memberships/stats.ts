import { cache } from "react"
import { getListMemberships } from "@/lib/service"
import { pageResult } from "@/lib/search-params"

export interface MembershipStats {
    total: number
    active: number
    pending: number
    ended: number
}

/**
 * `cache()` keys primitives by value and objects by reference, so this takes
 * no options object — the same call from the cards and any future caller
 * shares one set of requests per render.
 */
export const membershipStats = cache(async (): Promise<MembershipStats | null> => {
    try {
        const totalRequest = getListMemberships({ limit: 1, offset: 0, sort: "ASC" })
        const activeRequest = getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "active" })
        const pendingRequest = getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "pending" })
        const endedRequest = getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "ended" })
        const [totalResult, activeResult, pendingResult, endedResult] = await Promise.all([
            totalRequest,
            activeRequest,
            pendingRequest,
            endedRequest,
        ])
        return {
            total: pageResult(totalResult).total,
            active: pageResult(activeResult).total,
            pending: pageResult(pendingResult).total,
            ended: pageResult(endedResult).total,
        }
    } catch (error) {
        console.warn("Failed to load membership stats", error)
        return null
    }
})
