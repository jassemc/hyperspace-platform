import { getListBookings } from "@/lib/service"
import type { BookingDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { CalendarCheckIcon, ClockIcon, XCircleIcon, CoinsIcon } from "lucide-react"
import { formatPriceHt } from "@/lib/format"

export async function SectionCards() {
  let bookings: BookingDto[] = []
  let total = 0

  try {
    const response = await getListBookings({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<BookingDto>(response)
    bookings = page.results
    total = page.total
  } catch (error) {
    console.warn("Failed to load booking stats", error)
  }

  const count = (status: string) => bookings.filter((booking) => booking.status === status).length
  // A null price means the booking was fully covered by credits.
  const booked = bookings.reduce((sum, booking) => sum + (booking.priceHt ?? 0), 0)

  return (
    <StatCards
      cards={[
        { label: "Total bookings", value: total, badge: "All", icon: CalendarCheckIcon, footer: "Across the current page" },
        { label: "Pending", value: count("pending"), badge: "To confirm", icon: ClockIcon, footer: "Awaiting confirmation" },
        { label: "Cancelled", value: count("cancelled"), badge: "Released", icon: XCircleIcon, footer: "Slots freed again" },
        { label: "Booked value", value: formatPriceHt(booked), badge: "HT", icon: CoinsIcon, footer: "Credit-covered bookings count as zero" },
      ]}
    />
  )
}
