/**
 * Tags on the platform's cached aggregate reads (see lib/cached-stats.ts).
 * Each domain's server actions expire their own after a write; the backend
 * POSTs the same names to /api/revalidate after a website lead or booking
 * request (hscowork/platform-hscowork-backend#50) — writes no action here
 * ever sees, which left the summary cards and tab counts one row behind the
 * table until the TTL passed.
 */
export const STATS_CACHE_TAGS = {
  opportunities: "stats:opportunities",
  members: "stats:members",
  bookings: "stats:bookings",
  memberships: "stats:memberships",
  companies: "stats:companies",
} as const

export type StatsCacheTag = (typeof STATS_CACHE_TAGS)[keyof typeof STATS_CACHE_TAGS]

export function isStatsCacheTag(value: unknown): value is StatsCacheTag {
  return (
    typeof value === "string" &&
    (Object.values(STATS_CACHE_TAGS) as string[]).includes(value)
  )
}
