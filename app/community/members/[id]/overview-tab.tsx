import type { MemberDetailsDto } from "@/lib/service/HsService"
import { primaryTimeZone } from "@/lib/locations"
import { Kpis } from "./overview/kpis"
import { CurrentMemberships } from "./overview/current-memberships"
import { OpenBilling } from "./overview/open-billing"
import { RecentActivity } from "./overview/recent-activity"

/**
 * State on the left, what happened on the right, the numbers on top. Every
 * figure comes from the member payload (spec §0); the only request here is
 * the location's zone. Actions live on each tab's header.
 */
export async function OverviewTab({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const timeZone = await primaryTimeZone().catch(() => "UTC")

  return (
    <div>
      <Kpis member={member} />
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
