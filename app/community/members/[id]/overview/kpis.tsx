import { StatCards } from "@/components/stat-cards"
import { CalendarClock, CreditCard, IdCard, Receipt } from "lucide-react"
import type { MemberDetailsDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"

/** Available credit across every membership the member can draw on. */
export function creditsAvailable(member: MemberDetailsDto): number {
  return member.credits.balances
    .flatMap((block) => block.balances)
    .reduce((sum, balance) => sum + balance.available, 0)
}

/** The four figures staff glance at before anything else. */
export function Kpis({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const { memberships, bookings, invoices, charges } = member
  const credits = creditsAvailable(member)

  return (
    <StatCards
      cards={[
        {
          label: "Memberships",
          value: memberships.active,
          unit: "active",
          icon: IdCard,
          footer: `${memberships.total} in total`,
        },
        {
          label: "Credits",
          value: credits,
          unit: "available",
          icon: CreditCard,
          footer: "Own and employer-pooled memberships",
        },
        {
          label: "Bookings",
          value: bookings.upcoming,
          unit: "upcoming",
          icon: CalendarClock,
          footer: bookings.items[0]
            ? `Next: ${bookings.items[0].title || bookings.items[0].resource.name}`
            : "Nothing booked ahead",
        },
        {
          label: "Outstanding",
          value: formatPriceHt(invoices.outstandingTtc),
          icon: Receipt,
          footer: `${invoices.open} open invoice${invoices.open === 1 ? "" : "s"} · ${
            charges.uninvoiced
          } uninvoiced charge${charges.uninvoiced === 1 ? "" : "s"}`,
        },
      ]}
    />
  )
}
