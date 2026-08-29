import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCompany } from "@/lib/service"
import type { CompanyDto } from "@/lib/service/HsService"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { CompanyTabs } from "./company-tabs"
import { OverviewTab } from "./overview-tab"
import { MembersTab } from "./members-tab"
import { PlansTab } from "./plans-tab"
import { EditCompanyButton } from "./edit-company-button"
import { TableSkeleton } from "@/components/table-skeleton"
import { firstParam } from "@/lib/search-params"
import { COMPANY_STATUS_CLASSES, COMPANY_STATUS_LABELS } from "../company-status"

const VALID_TABS = ["overview", "members", "plans"]

export default async function CompanyDetailsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const requestedTab = firstParam(resolvedSearchParams?.tab)
  const activeTab = requestedTab && VALID_TABS.includes(requestedTab) ? requestedTab : "overview"

  let company: CompanyDto
  try {
    company = (await getCompany(id)) as CompanyDto
  } catch (error) {
    console.warn(`Failed to load company ${id}`, error)
    notFound()
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

      <div className="flex items-center justify-between py-2 px-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-semibold">{company.name}</h1>
            <Badge variant="secondary" className={`${COMPANY_STATUS_CLASSES[company.status] ?? ""} border-0`}>
              {COMPANY_STATUS_LABELS[company.status] ?? company.status}
            </Badge>
          </div>
          {company.taxId && (
            <p className="mt-2 text-sm text-muted-foreground">Tax ID {company.taxId}</p>
          )}
        </div>
        <EditCompanyButton company={company} />
      </div>

      <CompanyTabs activeTab={activeTab}>
        {activeTab === "overview" && <OverviewTab company={company} />}

        {activeTab === "members" && (
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <MembersTab companyId={id} searchParams={resolvedSearchParams} />
          </Suspense>
        )}

        {activeTab === "plans" && (
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <PlansTab
              companyId={id}
              companyName={company.name}
              searchParams={resolvedSearchParams}
            />
          </Suspense>
        )}
      </CompanyTabs>
    </div>
  )
}
