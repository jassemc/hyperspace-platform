"use server"
import "server-only"

import { hsService } from "./service/api"
import type { RequestParams } from "./shared/types"

/**
 * Endpoints the generated `lib/service/index.ts` wrapper does not re-export,
 * even though the client in `HsService.ts` implements them.
 *
 * Kept outside `lib/service/` so a regeneration does not overwrite it. If a
 * future regeneration starts exporting these, delete the matching function here
 * and import from `@/lib/service` instead.
 */

/** POST /checkins/{id}/checkout — closes an open presence interval. */
export async function checkOut(id: string, params?: RequestParams) {
    return hsService.api.checkOut(id, params)
}
