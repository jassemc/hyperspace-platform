import { cache } from "react"
import { getOpportunityStats } from "@/lib/service"
import type {
  OpportunityInterest,
  OpportunityStatsDto,
} from "@/lib/service/HsService"

/**
 * The tabs and the summary cards both want the pipeline. Memoised per request,
 * so rendering them side by side asks the API once. Always call it with the
 * argument: cache() keys on the argument list, and f() is not f(undefined).
 */
export const opportunityStats = cache(
  async (
    q: string | undefined,
    interest: OpportunityInterest | undefined
  ): Promise<OpportunityStatsDto | null> => {
    try {
      return (await getOpportunityStats({ q, interest })) as OpportunityStatsDto
    } catch (error) {
      console.warn("Failed to load opportunity stats", error)
      return null
    }
  }
)
