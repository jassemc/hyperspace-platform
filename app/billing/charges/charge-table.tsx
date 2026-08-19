"use client"

import { DataTable } from "@/components/data-table"
import type { ChargeDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface ChargeTableProps {
  data: ChargeDto[]
  totalCount?: number
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}

export function ChargeTable({
  data,
  totalCount,
  memberNames = {},
  companyNames = {},
}: Readonly<ChargeTableProps>) {
  const columns = createColumns({ memberNames, companyNames })

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={typeof totalCount === "number" ? totalCount : undefined}
    />
  )
}
