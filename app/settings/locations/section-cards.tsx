import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListLocations } from "@/lib/service"
import type { LocationDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { MapPinIcon, CheckCircle2Icon, ClockIcon, CalendarOffIcon } from "lucide-react"

export async function SectionCards() {
  let locations: LocationDto[] = []
  let total = 0

  try {
    const response = await getListLocations({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<LocationDto>(response)
    locations = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load location stats", error)
  }

  const withHours = locations.filter((location) =>
    Object.values(location.openingHours ?? {}).some((windows) => (windows ?? []).length > 0)
  ).length
  const closures = locations.reduce((sum, location) => sum + (location.closedDays ?? []).length, 0)

  return (
    <StatCards
      cards={[
        { label: "Total locations", value: total, badge: "Sites", icon: MapPinIcon, footer: "Sites resources belong to" },
        { label: "Active", value: locations.filter((location) => location.active).length, badge: "Live", icon: CheckCircle2Icon, footer: "Currently operating" },
        { label: "With opening hours", value: withHours, badge: "Hours", icon: ClockIcon, footer: "Bookings are gated by these" },
        { label: "Closure rules", value: closures, badge: "Closed", icon: CalendarOffIcon, footer: "Holidays and one-off closures" },
      ]}
    />
  )
}
