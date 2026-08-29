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
        const [total, active, pending, ended] = await Promise.all([
            pageResult(await getListMemberships({ limit: 1, offset: 0, sort: "ASC" })).total,
            pageResult(
                await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "active" })
            ).total,
            pageResult(
                await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "pending" })
            ).total,
            pageResult(
                await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "ended" })
            ).total,
        ])
        return { total, active, pending, ended }
    } catch (error) {
        console.warn("Failed to load membership stats", error)
        return null
    }
})
