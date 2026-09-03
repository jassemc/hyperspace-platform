import type { MemberDetailsDto } from "@/lib/service/HsService"
import { primaryTimeZone } from "@/lib/locations"
import { memberPath } from "./member-route"
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
          <CurrentMemberships
            memberships={member.memberships}
            credits={member.credits}
            viewAllHref={memberPath(member.id, "memberships")}
          />
          <OpenBilling
            invoices={member.invoices}
            charges={member.charges}
            invoicesHref={memberPath(member.id, "invoices")}
            uninvoicedHref={`${memberPath(member.id, "charges")}&uninvoiced=true`}
          />
        </div>
        <RecentActivity
          bookings={member.bookings}
          checkins={member.checkins}
          credits={member.credits}
          viewAllHref={memberPath(member.id, "checkins")}
          timeZone={timeZone}
        />
      </div>
    </div>
  )
}
