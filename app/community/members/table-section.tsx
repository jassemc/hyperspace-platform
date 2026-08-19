import { getListMembers, getListCompanies } from "@/lib/service"
import type {
  CompanyDto,
  ListMembersParams,
  MemberDto,
  MemberKindHint,
} from "@/lib/service/HsService"
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

const MEMBER_KIND_HINTS: MemberKindHint[] = ["lead", "visitor", "member"]

function asKindHint(value: string | undefined): MemberKindHint | undefined {
  return MEMBER_KIND_HINTS.includes(value as MemberKindHint)
    ? (value as MemberKindHint)
    : undefined
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
  // The shared table writes its tab selection to `status`; for members that
  // selection is a kindHint, the only lifecycle filter the endpoint accepts.
  const kindHint = asKindHint(firstParam(resolvedSearchParams?.status))
  const searchQuery = firstParam(resolvedSearchParams?.name)

  const query: ListMembersParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
    kindHint,
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

  // Members carry only `companyId`, so resolve employer names for the table.
  const companyNames: Record<string, string> = {}
  try {
    const companies = await getListCompanies({ limit: 100, offset: 0, sort: "ASC" })
    for (const company of (companies?.results ?? []) as CompanyDto[]) {
      companyNames[company.id] = company.name
    }
  } catch (error) {
    console.warn("Failed to load companies for member lookup", error)
  }

  return (
    <MemberTable
      data={results}
      totalCount={total}
      companyNames={companyNames}
      activeKindHint={kindHint}
    />
  )
}
