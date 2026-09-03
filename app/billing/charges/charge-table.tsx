"use client"

import { DataTable } from "@/components/data-table"
import type { ChargeDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface ChargeTableProps {
  data: ChargeDto[]
  totalCount?: number
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
  /** Member page: every row is theirs. */
  hideCustomer?: boolean
}

export function ChargeTable({
  data,
  totalCount,
  memberNames = {},
  companyNames = {},
  hideCustomer = false,
}: Readonly<ChargeTableProps>) {
  const columns = createColumns({ memberNames, companyNames, hideCustomer })

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={typeof totalCount === "number" ? totalCount : undefined}
    />
  )
}
