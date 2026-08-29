import { cache } from "react"
import { unstable_cache } from "next/cache"
import type { RequestParams } from "@hscowork/service-generator/runtime"
import { getAccessToken } from "@/lib/auth/session"

/** Five minutes: the safety net for writes the actions never see (website onboarding, backend jobs). */
export const STATS_TTL_SECONDS = 300

/**
 * Stats survive across requests — a tab switch re-renders the page but must
 * not re-ask the API — and are dropped when this domain's actions call
 * revalidateTag(tag). The caller's token is read OUTSIDE the cached function
 * (cookies() is not allowed inside) and reaches the request through the
 * closure, which unstable_cache does not key on: staff share one entry per
 * argument tuple, which is right for aggregates that carry no per-user data.
 * Failures throw inside so they are never cached; the outer wrapper turns
 * them into null like before.
 */
export function cachedStats<Args extends (string | undefined)[], Result>(
  tag: string,
  load: (params: RequestParams, ...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result | null> {
  return cache(async (...args: Args): Promise<Result | null> => {
    try {
      const token = await getAccessToken()
      if (!token) return await load({}, ...args)
      const params: RequestParams = { secure: false, headers: { Authorization: `Bearer ${token}` } }
      const cached = unstable_cache((...inner: Args) => load(params, ...inner), [tag], {
        tags: [tag],
        revalidate: STATS_TTL_SECONDS,
      })
      return await cached(...args)
    } catch (error) {
      console.warn(`Failed to load ${tag}`, error)
      return null
    }
  })
}
