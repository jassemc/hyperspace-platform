import { getListAssignments } from "@/lib/service"
import type { AssignmentDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { ArmchairIcon, CheckCircle2Icon, InfinityIcon, CalendarX2Icon } from "lucide-react"

export async function SectionCards() {
  let assignments: AssignmentDto[] = []
  let total = 0

  try {
    const response = await getListAssignments({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<AssignmentDto>(response)
    assignments = page.results
    total = page.total
  } catch (error) {
    console.warn("Failed to load assignment stats", error)
  }

  const active = assignments.filter(
    (assignment) => !assignment.endsAt || new Date(assignment.endsAt).getTime() > Date.now()
  ).length
  const openEnded = assignments.filter((assignment) => !assignment.endsAt).length

  return (
    <StatCards
      cards={[
        { label: "Total assignments", value: total, badge: "All", icon: ArmchairIcon, footer: "Desks and offices allocated" },
        { label: "Active", value: active, badge: "Live", icon: CheckCircle2Icon, footer: "Running right now" },
        { label: "Open-ended", value: openEnded, badge: "No end", icon: InfinityIcon, footer: "Without a planned end date" },
        { label: "Ended", value: total - active, badge: "Closed", icon: CalendarX2Icon, footer: "Past their end date" },
      ]}
    />
  )
}
