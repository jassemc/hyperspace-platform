import type { MemberDetailsDto } from "@/lib/service/HsService"
import type { BookingLookups } from "@/app/booking/bookings/lookups"
import { AddMembershipButton } from "@/app/community/memberships/add-membership-button"
import { AddBookingButton } from "@/app/booking/bookings/add-booking-button"
import { AddCheckinButton } from "@/app/booking/checkins/add-checkin-button"
import { CheckoutButton } from "@/app/booking/checkins/checkout-button"
import { AddCreditButton } from "@/app/billing/credits/add-credit-button"
import { AddChargeButton } from "@/app/billing/charges/add-charge-button"
import { AddInvoiceButton } from "@/app/billing/invoices/add-invoice-button"

/**
 * Every "do something for this member" in one row, each opening its form
 * with the member already selected. Check in flips to Check out while the
 * member is on site.
 */
export function QuickActions({
  member,
  lookups,
  timeZone,
}: Readonly<{ member: MemberDetailsDto; lookups: BookingLookups; timeZone: string }>) {
  const onSite = member.checkins.onSite

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 px-4">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Quick actions
      </span>
      <AddMembershipButton defaultMemberId={member.id} />
      <AddBookingButton lookups={lookups} timeZone={timeZone} defaultMemberId={member.id} />
      {onSite ? (
        <CheckoutButton checkinId={onSite.id} memberName={member.fullName} />
      ) : (
        <AddCheckinButton defaultMemberId={member.id} />
      )}
      <AddCreditButton defaultMemberId={member.id} />
      <AddChargeButton defaultMemberId={member.id} />
      <AddInvoiceButton defaultMemberId={member.id} />
    </div>
  )
}
