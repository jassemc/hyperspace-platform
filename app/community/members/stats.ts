import { cache } from "react"
import { getListMembers } from "@/lib/service"
import type { MemberKindHint } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"

export interface MemberStats {
    total: number
    leads: number
    visitors: number
    members: number
}

/** One `limit: 1` request per figure; `meta.totalItems` is the count. */
async function countMembers(kindHint?: MemberKindHint): Promise<number> {
    return pageResult(await getListMembers({ limit: 1, offset: 0, sort: "ASC", kindHint })).total
}

/**
 * `cache()` keys primitives by value and objects by reference, so this takes
 * no options object — the same call from the cards and any future caller
 * shares one set of requests per render.
 */
export const memberStats = cache(async (): Promise<MemberStats | null> => {
    try {
        const [total, leads, visitors, members] = await Promise.all([
            countMembers(),
            countMembers("lead"),
            countMembers("visitor"),
            countMembers("member"),
        ])
        return { total, leads, visitors, members }
    } catch (error) {
        console.warn("Failed to load member stats", error)
        return null
    }
})
