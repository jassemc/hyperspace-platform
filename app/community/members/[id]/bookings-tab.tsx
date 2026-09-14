import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListBookings } from "@/lib/service"
import type { BookingDto, BookingStatus, MemberDetailsDto } from "@/lib/service/HsService"
import {
  asEnum,
  firstParam,
  pageQuery,
  pageResult,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/search-params"
import { primaryTimeZone } from "@/lib/locations"
import { BookingTable } from "@/app/booking/bookings/booking-table"
import { AddBookingButton } from "@/app/booking/bookings/add-booking-button"
import { BOOKING_STATUS_VALUES } from "@/app/booking/bookings/booking-status"
import { bookingLookups, type BookingLookups } from "@/app/booking/bookings/lookups"

export async function BookingsTab({
  member,
  searchParams,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<BookingStatus>(firstParam(params.status), BOOKING_STATUS_VALUES)

  const empty: BookingLookups = { resources: [], members: [], companies: [] }
  const [response, lookups, timeZone] = await Promise.all([
    getListBookings({ limit, offset, sort: "DESC", q, status, memberId: member.id }).catch(
      (error) => {
        escalateAuthError(error)
        console.warn("Failed to load member bookings", error)
        return null
      }
    ),
    bookingLookups().catch(() => empty),
    primaryTimeZone().catch(() => "UTC"),
  ])
  const { results, total } = response ? pageResult<BookingDto>(response) : { results: [], total: 0 }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Bookings</h2>
          <p className="text-sm text-muted-foreground">Booked by {member.fullName}, newest first.</p>
        </div>
        <AddBookingButton lookups={lookups} timeZone={timeZone} defaultMemberId={member.id} />
      </div>
      <BookingTable
        data={results}
        totalCount={total}
        resources={lookups.resources}
        members={lookups.members}
        companies={lookups.companies}
        timeZone={timeZone}
        activeStatus={status}
        hideCustomer
        showFilters={false}
        defaultMemberId={member.id}
      />
    </div>
  )
}
