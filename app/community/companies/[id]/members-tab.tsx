import { getListMembers } from "@/lib/service"
import type { ListMembersParams, MemberDto } from "@/lib/service/HsService"
import { AttachMemberButton } from "./attach-member-button"
import { CompanyMembersTable } from "./company-members-table"

type MembersPage = { results?: MemberDto[]; meta?: { totalItems?: number } }

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function MembersTab({
  companyId,
  searchParams,
}: Readonly<{
  companyId: string
  searchParams?: Record<string, string | string[] | undefined>
}>) {
  const page = Number(firstParam(searchParams?.page)) || 1
  const pageSize = Number(firstParam(searchParams?.pageSize)) || 10
  const searchQuery = firstParam(searchParams?.name)

  const query: ListMembersParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    companyId,
    q: searchQuery || undefined,
  }

  let results: MemberDto[] = []
  let total = 0

  try {
    const response = (await getListMembers(query)) as MembersPage
    results = response.results ?? []
    total = response.meta?.totalItems ?? results.length
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
      <CompanyMembersTable data={results} totalCount={total} companyId={companyId} />
    </div>
  )
}
