import type { MemberDetailsDto } from "@/lib/service/HsService"
import { primaryTimeZone } from "@/lib/locations"
import { bookingLookups, type BookingLookups } from "@/app/booking/bookings/lookups"
import { Kpis } from "./overview/kpis"
import { QuickActions } from "./overview/quick-actions"
import { CurrentMemberships } from "./overview/current-memberships"
import { OpenBilling } from "./overview/open-billing"
import { RecentActivity } from "./overview/recent-activity"

/**
 * State on the left, what happened on the right, the numbers on top. Every
 * figure comes from the member payload (spec §0); the only requests here
 * are the booking dialog's seed lists and the location's zone.
 */
export async function OverviewTab({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const empty: BookingLookups = { resources: [], members: [], companies: [] }
  const [lookups, timeZone] = await Promise.all([
    bookingLookups().catch(() => empty),
    primaryTimeZone().catch(() => "UTC"),
  ])

  return (
    <div>
      <Kpis member={member} />
      <QuickActions member={member} lookups={lookups} timeZone={timeZone} />
      <div className="grid gap-4 px-4 xl:grid-cols-2">
        <div className="space-y-4">
          <CurrentMemberships member={member} />
          <OpenBilling member={member} />
        </div>
        <RecentActivity member={member} timeZone={timeZone} />
      </div>
    </div>
  )
}
