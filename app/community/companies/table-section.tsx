import { getListCompanies } from "@/lib/service"
import type { CompanyDto, ListCompaniesParams } from "@/lib/service/HsService"
import { CompanyTable } from "./company-table"

type CompaniesPage = {
  results?: CompanyDto[]
  meta?: { totalItems?: number }
}

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export async function CompanyTableSection({
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
  const searchQuery = firstParam(resolvedSearchParams?.name)

  const query: ListCompaniesParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort: "ASC",
    q: searchQuery || undefined,
  }

  let results: CompanyDto[] = []
  let total = 0

  try {
    const response = (await getListCompanies(query)) as CompaniesPage
    results = response.results ?? []
    total = response.meta?.totalItems ?? results.length
  } catch (error) {
    console.warn("Failed to load companies", error)
  }

  return <CompanyTable data={results} totalCount={total} />
}
