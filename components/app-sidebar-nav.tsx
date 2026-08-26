import { cache } from "react"
import { getListResourceTypes } from "@/lib/service"
import type { ResourceTypeDto } from "@/lib/service/HsService"
import type { NavigationItem } from "@/lib/navigation-config"
import { AppSidebar } from "@/components/app-sidebar"

/**
 * The resource-type menu entries, read on the server as part of the layout.
 *
 * The sidebar used to fetch these from a mount effect. Every function in
 * lib/service is a Server Action, so that read was a POST — and a Server
 * Action's response re-renders the whole route, which meant every page in the
 * app rendered twice and issued its data twice.
 */
const TTL_MS = 5 * 60 * 1000
let cached: { at: number; items: NavigationItem[] } | null = null

/**
 * Cleared by the resource-type screen so a new type shows in the menu at once
 * rather than whenever the window happens to lapse.
 */
export function clearResourceTypeNav() {
  cached = null
}

const resourceTypeNavItems = cache(async (): Promise<NavigationItem[]> => {
  // The catalogue is the same for everyone and changes about never, so one
  // copy is held for the whole server rather than read on every page load.
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.items
  }

  try {
    const response = await getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
    const items = ((response?.results ?? []) as ResourceTypeDto[]).map((type) => ({
      title: type.name,
      url: `/space/resources?resourceTypeId=${encodeURIComponent(type.id)}`,
    }))
    cached = { at: Date.now(), items }
    return items
  } catch (error) {
    console.warn("Failed to load resource types for navigation", error)
    // A stale menu beats an empty one.
    return cached?.items ?? []
  }
})

export async function AppSidebarNav() {
  return <AppSidebar resourceTypeItems={await resourceTypeNavItems()} />
}
