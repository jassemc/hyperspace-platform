import { getListMembers } from "@/lib/service"
import type { ListMembersParams, MemberDto, MemberStatus } from "@/lib/service/HsService"
import { MemberTable } from "./member-table"

type MembersPage = {
  results?: MemberDto[]
  meta?: { totalItems?: number }
}

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function MemberTableSection({
  searchParams,
}: Readonly<{
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
}>) {
  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams

  const page = Number(firstParam(resolvedSearchParams?.page)) || 1
  const pageSize = Number(firstParam(resolvedSearchParams?.pageSize)) || 10
  const statusParam = firstParam(resolvedSearchParams?.status) as MemberStatus | undefined
  const searchQuery = firstParam(resolvedSearchParams?.name)

  const query: ListMembersParams = {
    limit: statusParam ? 1000 : pageSize,
    offset: statusParam ? 0 : (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
  }

  let results: MemberDto[] = []
  let total = 0

  try {
    const response = (await getListMembers(query)) as MembersPage
    let allResults = response.results ?? []

    if (statusParam) {
      allResults = allResults.filter((member) => member.status === statusParam)
      total = allResults.length
      const start = (page - 1) * pageSize
      results = allResults.slice(start, start + pageSize)
    } else {
      results = allResults
      total = response.meta?.totalItems ?? results.length
    }
  } catch (error) {
    console.warn("Failed to load members", error)
  }

  return <MemberTable data={results} totalCount={total} />
}
