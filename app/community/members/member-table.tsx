"use client"

import { useState } from "react"
import { DataTable } from "@/app/dashboard/resources/data-table"
import { AddMemberForm } from "./add-member-form"
import type { MemberDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

const MEMBER_STATUS_TABS = [
  { value: "lead", label: "Lead" },
  { value: "drop-in", label: "Drop-in" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "former", label: "Former" },
]

interface MemberTableProps {
  data: MemberDto[]
  totalCount?: number
}

export function MemberTable({ data, totalCount }: Readonly<MemberTableProps>) {
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
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        showStatusTabs={true}
        statusTabOptions={MEMBER_STATUS_TABS}
      />
      <AddMemberForm
        key={editingMember?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingMember={editingMember}
      />
    </>
  )
}
