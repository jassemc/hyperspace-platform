import { getListCompanies } from "@/lib/service"
import type { CompanyDto } from "@/lib/service/HsService"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2Icon, FileTextIcon, GlobeIcon, MailIcon } from "lucide-react"

type CompaniesPage = {
  results?: CompanyDto[]
  meta?: { totalItems?: number }
}

type CompanyStats = {
  total: number
  withTaxId: number
  contactable: number
  withWebsite: number
}

async function loadCompanyStats(): Promise<CompanyStats> {
  try {
    const response = (await getListCompanies({
      limit: 1000,
      offset: 0,
      sort: "ASC",
    })) as CompaniesPage

    const companies = response.results ?? []
    const total = response.meta?.totalItems ?? companies.length

    return {
      total,
      withTaxId: companies.filter((company) => Boolean(company.taxId)).length,
      contactable: companies.filter((company) => Boolean(company.email || company.phone)).length,
      withWebsite: companies.filter((company) => Boolean(company.website)).length,
    }
  } catch (error) {
    console.warn("Failed to load company stats", error)
    return { total: 0, withTaxId: 0, contactable: 0, withWebsite: 0 }
  }
}

export async function SectionCards() {
  const stats = await loadCompanyStats()

  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-4 mb-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total companies</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.total}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Building2Icon className="size-3" />
              CRM
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Organizations in your community directory</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Tax ID on file</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.withTaxId}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <FileTextIcon className="size-3" />
              Billing
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Companies ready to be invoiced</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Contactable</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.contactable}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <MailIcon className="size-3" />
              Reach
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Companies with an email or phone</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>With website</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.withWebsite}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <GlobeIcon className="size-3" />
              Profile
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Companies with a public web presence</div>
        </CardFooter>
      </Card>
    </div>
  )
}
