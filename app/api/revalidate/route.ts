import { timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { isStatsCacheTag, type StatsCacheTag } from "@/lib/cache-tags"

export const dynamic = "force-dynamic"

/**
 * On-demand expiry of the stats caches, called by the Hyperspace backend
 * after a website lead or booking request
 * (hscowork/platform-hscowork-backend#50). The table is read live on every
 * request while the summary cards and tab counts come from unstable_cache
 * with a five-minute TTL, so without this the two disagreed by exactly the
 * rows the website had just added.
 *
 * Mirrors the booking page's route: authenticated by the shared
 * REVALIDATE_SECRET (the backend's PUBLIC_REVALIDATE_SECRET); unconfigured
 * means the endpoint is off. Unknown tags are ignored, and a body with none
 * known is a 400 so a misconfigured caller finds out.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { type: "revalidation_not_configured", status: 503, title: "Revalidation is not configured" },
      { status: 503 }
    )
  }
  if (!sameSecret(req.headers.get("x-revalidate-secret"), secret)) {
    return NextResponse.json(
      { type: "forbidden", status: 403, title: "Invalid revalidation secret" },
      { status: 403 }
    )
  }

  let tags: unknown
  try {
    tags = ((await req.json()) as { tags?: unknown } | null)?.tags
  } catch {
    tags = undefined
  }
  const known: StatsCacheTag[] = Array.isArray(tags) ? tags.filter(isStatsCacheTag) : []
  if (known.length === 0) {
    return NextResponse.json(
      { type: "missing_tags", status: 400, title: "Body must carry known cache tags" },
      { status: 400 }
    )
  }

  for (const tag of known) revalidateTag(tag)
  return NextResponse.json({ revalidated: known, now: Date.now() })
}

function sameSecret(given: string | null, expected: string): boolean {
  if (!given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
