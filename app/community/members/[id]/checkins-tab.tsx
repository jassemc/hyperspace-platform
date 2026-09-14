import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListCheckins, getListLocations } from "@/lib/service"
import type { CheckinDto, LocationDto, MemberDetailsDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { CheckinTable } from "@/app/booking/checkins/checkin-table"
import { AddCheckinButton } from "@/app/booking/checkins/add-checkin-button"

export async function CheckinsTab({
  member,
  searchParams,
}: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  const [response, locations] = await Promise.all([
    getListCheckins({ limit, offset, sort: "DESC", q, memberId: member.id }).catch((error) => {
      escalateAuthError(error)
      console.warn("Failed to load member check-ins", error)
      return null
    }),
    getListLocations({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
  ])
  const { results, total } = response ? pageResult<CheckinDto>(response) : { results: [], total: 0 }

  const locationNames: Record<string, string> = {}
  for (const location of (locations?.results ?? []) as LocationDto[]) {
    locationNames[location.id] = location.name
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Check-ins</h2>
          <p className="text-sm text-muted-foreground">Visits by {member.fullName}, newest first.</p>
        </div>
        <AddCheckinButton defaultMemberId={member.id} />
      </div>
      <CheckinTable
        data={results}
        totalCount={total}
        locationNames={locationNames}
        hideMember
      />
    </div>
  )
}
