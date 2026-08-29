import type { MemberDetailsDto } from "@/lib/service/HsService"
import { primaryTimeZone } from "@/lib/locations"
import { bookingLookups, type BookingLookups } from "@/app/booking/bookings/lookups"
import { MembershipsCard } from "./overview/memberships-card"
import { BookingsCard } from "./overview/bookings-card"
import { CheckinsCard } from "./overview/checkins-card"
import { CreditsCard } from "./overview/credits-card"
import { BillingCard } from "./overview/billing-card"

/**
 * Every figure here is already in the member payload (spec §0); the only
 * requests are the booking dialog's seed lists and the location's zone.
 */
export async function OverviewTab({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const empty: BookingLookups = { resources: [], members: [], companies: [] }
  const [lookups, timeZone] = await Promise.all([
    bookingLookups().catch(() => empty),
    primaryTimeZone().catch(() => "UTC"),
  ])

  return (
    <div className="grid gap-4 px-4 md:grid-cols-2 xl:grid-cols-3">
      <MembershipsCard member={member} />
      <BookingsCard member={member} lookups={lookups} timeZone={timeZone} />
      <CheckinsCard member={member} timeZone={timeZone} />
      <CreditsCard member={member} timeZone={timeZone} />
      <BillingCard member={member} />
    </div>
  )
}
