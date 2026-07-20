import { getListMembers } from "@/lib/service"
import type { ListMembersParams, MemberDto, MemberKindHint } from "@/lib/service/HsService"
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
  const kindHintParam = firstParam(resolvedSearchParams?.status) as MemberKindHint | undefined
  const searchQuery = firstParam(resolvedSearchParams?.name)

  const query: ListMembersParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
    kindHint: kindHintParam,
  }

  let results: MemberDto[] = []
  let total = 0

  try {
    const response = (await getListMembers(query)) as MembersPage
    results = response.results ?? []
    total = response.meta?.totalItems ?? results.length
  } catch (error) {
    console.warn("Failed to load members", error)
  }

  return <MemberTable data={results} totalCount={total} />
}
