import { getListCheckins } from "@/lib/service"
import type { CheckinDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { DoorOpenIcon, UsersIcon, QrCodeIcon, HandIcon } from "lucide-react"

export async function SectionCards() {
  let checkins: CheckinDto[] = []
  let total = 0

  try {
    const response = await getListCheckins({ limit: 100, offset: 0, sort: "DESC" })
    const page = pageResult<CheckinDto>(response)
    checkins = page.results
    total = page.total
  } catch (error) {
    console.warn("Failed to load check-in stats", error)
  }

  const onSite = checkins.filter((checkin) => !checkin.checkedOutAt).length

  return (
    <StatCards
      cards={[
        { label: "Total check-ins", value: total, badge: "All", icon: DoorOpenIcon, footer: "Recorded presence intervals" },
        { label: "On site now", value: onSite, badge: "Open", icon: UsersIcon, footer: "Not yet checked out" },
        { label: "Via QR", value: checkins.filter((c) => c.method === "qr").length, badge: "QR", icon: QrCodeIcon, footer: "Self-service scans" },
        { label: "Manual", value: checkins.filter((c) => c.method === "manual").length, badge: "Staff", icon: HandIcon, footer: "Recorded by staff" },
      ]}
    />
  )
}
