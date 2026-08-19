import { getListMemberships } from "@/lib/service"
import type { MembershipDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { BadgeCheckIcon, ClockIcon, PauseIcon, XCircleIcon } from "lucide-react"

export async function SectionCards() {
  let memberships: MembershipDto[] = []
  let total = 0

  try {
    const response = await getListMemberships({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<MembershipDto>(response)
    memberships = page.results
    total = page.total
  } catch (error) {
    console.warn("Failed to load membership stats", error)
  }

  const count = (status: string) => memberships.filter((m) => m.status === status).length

  return (
    <StatCards
      cards={[
        { label: "Total memberships", value: total, badge: "All", icon: BadgeCheckIcon, footer: "Every membership on record" },
        { label: "Active", value: count("active"), badge: "Live", icon: BadgeCheckIcon, footer: "Currently running" },
        { label: "Pending", value: count("pending"), badge: "Upcoming", icon: ClockIcon, footer: "Starting in the future" },
        { label: "Ended", value: count("ended"), badge: "Closed", icon: XCircleIcon, footer: "Past their end date" },
      ]}
    />
  )
}
