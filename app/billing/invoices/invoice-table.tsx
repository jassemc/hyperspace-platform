"use client"

import { DataTable } from "@/components/data-table"
import type { InvoiceDto, InvoiceStatus } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { INVOICE_STATUS_TABS } from "./invoice-status"

interface InvoiceTableProps {
  data: InvoiceDto[]
  totalCount?: number
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
  activeStatus?: InvoiceStatus
}

export function InvoiceTable({
  data,
  totalCount,
  memberNames = {},
  companyNames = {},
  activeStatus,
}: Readonly<InvoiceTableProps>) {
  const columns = createColumns({ memberNames, companyNames })

  return (
    <DataTable
      key={activeStatus ?? "all"}
      columns={columns}
      data={data}
      totalCount={typeof totalCount === "number" ? totalCount : undefined}
      showStatusTabs={true}
      statusTabOptions={INVOICE_STATUS_TABS}
    />
  )
}
