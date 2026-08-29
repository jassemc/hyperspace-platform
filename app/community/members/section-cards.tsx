import { StatCards } from "@/components/stat-cards"
import { UsersIcon, UserPlusIcon, FootprintsIcon, UserCheckIcon } from "lucide-react"
import { memberStats } from "./stats"

export async function SectionCards() {
  const stats = await memberStats()
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        {
          label: "Total members",
          value: figure(stats?.total),
          badge: "All",
          icon: UsersIcon,
          footer: "People in your community directory",
        },
        {
          label: "Leads",
          value: figure(stats?.leads),
          badge: "Pipeline",
          icon: UserPlusIcon,
          footer: "Flagged as leads",
        },
        {
          label: "Visitors",
          value: figure(stats?.visitors),
          badge: "Drop-in",
          icon: FootprintsIcon,
          footer: "Flagged as visitors",
        },
        {
          label: "Members",
          value: figure(stats?.members),
          badge: "Community",
          icon: UserCheckIcon,
          footer: "Flagged as members",
        },
      ]}
    />
  )
}
