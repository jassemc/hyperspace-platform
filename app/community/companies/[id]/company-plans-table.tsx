"use client"

import { DataTable } from "@/app/dashboard/resources/data-table"
import type { MembershipDto } from "@/lib/service/HsService"
import { createPlanColumns } from "./plans-columns"

interface CompanyPlansTableProps {
  data: MembershipDto[]
  totalCount?: number
  companyId: string
  plansById: Record<string, string>
  subscribersById: Record<string, string>
}

export function CompanyPlansTable({
  data,
  totalCount,
  companyId,
  plansById,
  subscribersById,
}: Readonly<CompanyPlansTableProps>) {
  const columns = createPlanColumns({ companyId, plansById, subscribersById })

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={typeof totalCount === "number" ? totalCount : undefined}
    />
  )
}
