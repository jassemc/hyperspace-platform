import { StatCards } from "@/components/stat-cards"
import { BadgeCheckIcon, ClockIcon, XCircleIcon } from "lucide-react"
import { membershipStats } from "./stats"

export async function SectionCards() {
  const stats = await membershipStats()
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        {
          label: "Total memberships",
          value: figure(stats?.total),
          badge: "All",
          icon: BadgeCheckIcon,
          footer: "Every membership on record",
        },
        {
          label: "Active",
          value: figure(stats?.active),
          badge: "Live",
          icon: BadgeCheckIcon,
          footer: "Currently running",
        },
        {
          label: "Pending",
          value: figure(stats?.pending),
          badge: "Upcoming",
          icon: ClockIcon,
          footer: "Starting in the future",
        },
        {
          label: "Ended",
          value: figure(stats?.ended),
          badge: "Closed",
          icon: XCircleIcon,
          footer: "Past their end date",
        },
      ]}
    />
  )
}
