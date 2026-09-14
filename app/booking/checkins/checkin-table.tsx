"use client"

import { DataTable } from "@/components/data-table"
import type { CheckinDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface CheckinTableProps {
  data: CheckinDto[]
  totalCount?: number
  locationNames?: Record<string, string>
  /** Member page: every row is theirs. */
  hideMember?: boolean
}

export function CheckinTable({
  data,
  totalCount,
  locationNames = {},
  hideMember = false,
}: Readonly<CheckinTableProps>) {
  const columns = createColumns({ locationNames, hideMember })

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={typeof totalCount === "number" ? totalCount : undefined}
    />
  )
}
