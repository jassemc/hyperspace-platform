import { StatCards } from "@/components/stat-cards"
import { Building2Icon, UsersIcon, BadgeCheckIcon, ClockIcon } from "lucide-react"
import { companyStats } from "./stats"

export async function SectionCards() {
  const stats = await companyStats()
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        {
          label: "Companies",
          value: figure(stats?.companies),
          badge: "All",
          icon: Building2Icon,
          footer: "Organizations in your community directory",
        },
        {
          label: "Members",
          value: figure(stats?.members),
          badge: "All",
          icon: UsersIcon,
          footer: "Across the whole community",
        },
        {
          label: "Active memberships",
          value: figure(stats?.activeMemberships),
          badge: "Live",
          icon: BadgeCheckIcon,
          footer: "Across the whole community",
        },
        {
          label: "Pending memberships",
          value: figure(stats?.pendingMemberships),
          badge: "Upcoming",
          icon: ClockIcon,
          footer: "Across the whole community",
        },
      ]}
    />
  )
}
