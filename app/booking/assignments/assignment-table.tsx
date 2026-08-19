"use client"

import { DataTable } from "@/components/data-table"
import type { AssignmentDto, MembershipDto, ResourceDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddAssignmentForm } from "./add-assignment-form"
import { useState } from "react"

interface AssignmentTableProps {
  data: AssignmentDto[]
  totalCount?: number
  resources?: ResourceDto[]
  memberships?: MembershipDto[]
  resourceNames?: Record<string, string>
  membershipNames?: Record<string, string>
}

export function AssignmentTable({
  data,
  totalCount,
  resources = [],
  memberships = [],
  resourceNames = {},
  membershipNames = {},
}: Readonly<AssignmentTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const columns = createColumns({ resourceNames, membershipNames, resources })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddAssignmentForm
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        resources={resources}
        memberships={memberships}
      />
    </>
  )
}
