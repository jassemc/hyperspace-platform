import { getListMembers } from "@/lib/service"
import type { MemberDto } from "@/lib/service/HsService"
import { pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { AttachMemberButton } from "./attach-member-button"
import { CompanyMembersTable } from "./company-members-table"

export async function MembersTab({
  companyId,
  searchParams,
}: Readonly<{
  companyId: string
  searchParams?: SearchParamsInput
}>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  let results: MemberDto[] = []
  let total = 0

  try {
    const response = await getListMembers({ limit, offset, sort: "ASC", companyId, q })
    ;({ results, total } = pageResult<MemberDto>(response))
  } catch (error) {
    console.warn("Failed to load company members", error)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            People whose employer is set to this company.
          </p>
        </div>
        <AttachMemberButton companyId={companyId} />
      </div>
      <CompanyMembersTable
        data={results}
        totalCount={total}
        companyId={companyId}
      />
    </div>
  )
}
