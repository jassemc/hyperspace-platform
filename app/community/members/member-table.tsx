"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { AddMemberForm } from "./add-member-form"
import type { MemberDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { MEMBER_KIND_TABS } from "./member-status"

interface MemberTableProps {
  data: MemberDto[]
  totalCount?: number
  companyNames?: Record<string, string>
  activeKindHint?: string
}

export function MemberTable({
  data,
  totalCount,
  companyNames = {},
  activeKindHint,
}: Readonly<MemberTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null)

  const handleEdit = (member: MemberDto) => {
    setEditingMember(member)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingMember(null)
  }

  const columns = createColumns({
    onEdit: handleEdit,
    companyNames,
  })

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={activeKindHint ?? "all"}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        showStatusTabs={true}
        statusTabOptions={MEMBER_KIND_TABS}
        serverSearch
        searchPlaceholder="Search members..."
      />
      <AddMemberForm
        key={editingMember?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingMember={editingMember}
        companyNames={companyNames}
      />
    </>
  )
}
