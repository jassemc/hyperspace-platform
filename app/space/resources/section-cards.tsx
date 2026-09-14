import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListResources } from "@/lib/service"
import type { ResourceDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { ArmchairIcon, CheckCircle2Icon, EyeOffIcon, UsersIcon } from "lucide-react"

export async function SectionCards() {
  let resources: ResourceDto[] = []
  let total = 0

  try {
    const response = await getListResources({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<ResourceDto>(response)
    resources = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load resource stats", error)
  }

  const seats = resources.reduce((sum, resource) => sum + (resource.capacity ?? 0), 0)

  return (
    <StatCards
      cards={[
        { label: "Total resources", value: total, badge: "Inventory", icon: ArmchairIcon, footer: "Desks, rooms and offices on record" },
        { label: "Available", value: resources.filter((resource) => resource.status === "available").length, badge: "Free", icon: CheckCircle2Icon, footer: "Not reserved or occupied right now" },
        { label: "Hidden", value: resources.filter((resource) => resource.hidden || !resource.active).length, badge: "Offline", icon: EyeOffIcon, footer: "Inactive or hidden from booking" },
        { label: "Seats", value: seats, badge: "Capacity", icon: UsersIcon, footer: "Combined capacity of all resources" },
      ]}
    />
  )
}
