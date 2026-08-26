import {
  getAnalyticsMemberships,
  getListBookings,
  getListCharges,
  getListCheckins,
  getListLocations,
  getListMembers,
  getListResources,
} from "@/lib/service"
import type {
  BookingDto,
  ChargeDto,
  CheckinDto,
  LocationDto,
  MemberDto,
  MembershipAnalyticsDto,
  ResourceDto,
} from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { apiName, apiString } from "@/lib/api-value"
import { formatDate, formatDateTime, formatPriceHt, formatTimeOfDay } from "@/lib/format"
import { SummaryTable } from "@/components/summary-table"

/** The things a staff member would act on first thing in the morning. */
export async function AttentionLists() {
  const [checkinPage, bookingPage, chargePage, memberPage, resourcePage, locationPage, analytics] =
    await Promise.all([
      getListCheckins({ limit: 100, offset: 0, sort: "DESC" }).catch(() => null),
      getListBookings({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
      getListCharges({ limit: 100, offset: 0, sort: "DESC", uninvoiced: true }).catch(() => null),
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
      getListResources({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
      getListLocations({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
      getAnalyticsMemberships({ expiringWithinDays: 30 }).catch(() => null),
    ])

  // Multiple locations can be in play; the dashboard has no single
  // location in scope, so the first one wins for this summary view.
  const locations = (locationPage?.results ?? []) as LocationDto[]
  const timeZone = locations[0]?.timezone ?? "UTC"

  const memberNames: Record<string, string> = {}
  for (const member of memberPage ? pageResult<MemberDto>(memberPage).results : []) {
    memberNames[member.id] = member.fullName
  }

  const resourceNames: Record<string, string> = {}
  for (const resource of resourcePage ? pageResult<ResourceDto>(resourcePage).results : []) {
    resourceNames[resource.id] = resource.name
  }

  const onSite = (checkinPage ? pageResult<CheckinDto>(checkinPage).results : []).filter(
    (checkin) => !checkin.checkedOutAt
  )

  const pending = (bookingPage ? pageResult<BookingDto>(bookingPage).results : []).filter(
    (booking) => booking.status === "pending"
  )

  const uninvoiced = chargePage
    ? pageResult<ChargeDto>(chargePage).results.filter((charge) => !apiString(charge.invoiceId))
    : []

  const expiring = ((analytics as MembershipAnalyticsDto | null)?.expiring ?? []).slice(0, 10)

  return (
    <div className="space-y-8">
      <SummaryTable
        title="On site now"
        subtitle={`${onSite.length} open check-in${onSite.length === 1 ? "" : "s"}`}
        emptyMessage="Nobody is checked in right now."
        headers={["Member", "Since", "Entitlement"]}
        rows={onSite
          .slice(0, 10)
          .map((checkin) => [
            memberNames[checkin.memberId] ?? "Unknown member",
            formatTimeOfDay(checkin.checkedInAt, timeZone),
            checkin.entitlementUsed,
          ])}
      />

      <SummaryTable
        title="Bookings awaiting confirmation"
        subtitle={pending.length > 0 ? `${pending.length} to review` : undefined}
        emptyMessage="No bookings are waiting."
        headers={["Booking", "Resource", "Starts"]}
        rows={pending
          .slice(0, 10)
          .map((booking) => [
            booking.title || "Untitled booking",
            resourceNames[booking.resourceId] ?? "Unknown resource",
            formatDateTime(booking.startsAt, timeZone),
          ])}
      />

      <SummaryTable
        title="Memberships expiring within 30 days"
        emptyMessage="Nothing expiring in the next 30 days."
        headers={["Plan", "Customer", "Ends"]}
        rows={expiring.map((row) => [
          row.planName,
          apiName(row.memberId, memberNames) ?? "Company",
          formatDate(row.endsAt),
        ])}
      />

      <SummaryTable
        title="Uninvoiced charges"
        subtitle={
          uninvoiced.length > 0
            ? `${formatPriceHt(uninvoiced.reduce((sum, charge) => sum + charge.amountHt, 0))} ready to bill`
            : undefined
        }
        emptyMessage="Every charge is on an invoice."
        headers={["Description", "Kind", "Amount"]}
        rows={uninvoiced
          .slice(0, 10)
          .map((charge) => [charge.description, charge.kind, formatPriceHt(charge.amountHt)])}
      />
    </div>
  )
}
