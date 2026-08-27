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
 *
 * Stays positional primitives, not an options object. React's cache() keys
 * primitive arguments by value (a Map, SameValueZero) and object/function
 * arguments by reference (a WeakMap). Two call sites that each build their
 * own `{ q, interest, ... }` literal would produce two distinct object
 * references and therefore two cache misses, even with identical contents —
 * so this stays positional on purpose. Resist folding it back into an
 * options object; it would silently double the request.
 */
export const opportunityStats = cache(
  async (
    q: string | undefined,
    interest: OpportunityInterest | undefined,
    createdFrom: string | undefined,
    createdTo: string | undefined
  ): Promise<OpportunityStatsDto | null> => {
    try {
      return (await getOpportunityStats({
        q,
        interest,
        createdFrom,
        createdTo,
      })) as OpportunityStatsDto
    } catch (error) {
      console.warn("Failed to load opportunity stats", error)
      return null
    }
  }
)
