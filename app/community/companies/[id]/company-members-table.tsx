"use client"

import { DataTable } from "@/components/data-table"
import type { MemberDto } from "@/lib/service/HsService"
import { createMemberColumns } from "./members-columns"

interface CompanyMembersTableProps {
  data: MemberDto[]
  totalCount?: number
  companyId: string
}

export function CompanyMembersTable({
  data,
  totalCount,
  companyId,
}: Readonly<CompanyMembersTableProps>) {
  const columns = createMemberColumns({ companyId })

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={typeof totalCount === "number" ? totalCount : undefined}
    />
  )
}
