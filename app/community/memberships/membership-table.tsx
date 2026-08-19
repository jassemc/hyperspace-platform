"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { MembershipDto, MembershipStatus, PlanDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddMembershipForm } from "./add-membership-form"
import { MEMBERSHIP_STATUS_TABS } from "./membership-status"

interface MembershipTableProps {
  data: MembershipDto[]
  totalCount?: number
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
  plans?: PlanDto[]
  activeStatus?: MembershipStatus
}

export function MembershipTable({
  data,
  totalCount,
  memberNames = {},
  companyNames = {},
  plans = [],
  activeStatus,
}: Readonly<MembershipTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<MembershipDto | null>(null)

  const handleEdit = (membership: MembershipDto) => {
    setEditingMembership(membership)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingMembership(null)
  }

  const columns = createColumns({ onEdit: handleEdit, memberNames, companyNames })

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={activeStatus ?? "all"}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        showStatusTabs={true}
        statusTabOptions={MEMBERSHIP_STATUS_TABS}
      />
      <AddMembershipForm
        key={editingMembership?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingMembership={editingMembership}
        memberNames={memberNames}
        companyNames={companyNames}
        plans={plans}
      />
    </>
  )
}
