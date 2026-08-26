import { cache } from "react"
import { getListLocations } from "@/lib/service"
import type { LocationDto } from "@/lib/service/HsService"

/**
 * The zone the page's clock is drawn in. One location is the common
 * case; when there are several the first wins, and the calendar's own
 * envelope timezone overrides it for the grid.
 */
export const primaryTimeZone = cache(async (): Promise<string> => {
  try {
    const page = await getListLocations({ limit: 1, offset: 0, sort: "ASC" })
    return ((page?.results ?? []) as LocationDto[])[0]?.timezone ?? "UTC"
  } catch {
    return "UTC"
  }
})
