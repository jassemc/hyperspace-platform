import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCompany } from "@/lib/service"
import type { CompanyDetailsDto } from "@/lib/service/HsService"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TableSkeleton } from "@/components/table-skeleton"
import { firstParam } from "@/lib/search-params"
import { resolveCompanyTab } from "./company-route"
import { CompanyTabs, type CompanyTabCounts } from "./company-tabs"
import { CompanyHeader } from "./company-header"
import { OverviewTab } from "./overview-tab"
import { MembersTab } from "./members-tab"
import { MembershipsTab } from "./memberships-tab"
import { BookingsTab } from "./bookings-tab"
import { CreditsTab } from "./credits-tab"
import { ChargesTab } from "./charges-tab"
import { InvoicesTab } from "./invoices-tab"

export default async function CompanyDetailsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const activeTab = resolveCompanyTab(firstParam(resolvedSearchParams?.tab))

  // One request: the company row plus every Overview block.
  let company: CompanyDetailsDto
  try {
    company = (await getCompany(id)) as CompanyDetailsDto
  } catch (error) {
    console.warn(`Failed to load company ${id}`, error)
    notFound()
  }

  const counts: CompanyTabCounts = {
    members: company.members.total,
    memberships: company.memberships.total,
    bookings: company.bookings.upcoming,
    credits: company.credits.recent.length,
    charges: company.charges.uninvoiced,
    invoices: company.invoices.open,
  }

  return (
    <div className="w-full py-6">
      <div className="px-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link href="/community/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to companies
          </Link>
        </Button>
      </div>

      <CompanyHeader company={company} />

      <div className="min-w-0">
        <CompanyTabs activeTab={activeTab} counts={counts}>
          {activeTab === "overview" && <OverviewTab company={company} />}
          {activeTab === "members" && (
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <MembersTab companyId={id} searchParams={resolvedSearchParams} />
            </Suspense>
          )}
          {activeTab === "memberships" && (
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <MembershipsTab
                companyId={id}
                companyName={company.name}
                searchParams={resolvedSearchParams}
              />
            </Suspense>
          )}
          {activeTab === "bookings" && (
            <BookingsTab company={company} searchParams={resolvedSearchParams} />
          )}
          {activeTab === "credits" && (
            <CreditsTab company={company} searchParams={resolvedSearchParams} />
          )}
          {activeTab === "charges" && (
            <ChargesTab company={company} searchParams={resolvedSearchParams} />
          )}
          {activeTab === "invoices" && (
            <InvoicesTab company={company} searchParams={resolvedSearchParams} />
          )}
        </CompanyTabs>
      </div>
    </div>
  )
}
