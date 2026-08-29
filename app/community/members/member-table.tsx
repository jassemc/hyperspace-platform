"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { MemberFormDialog } from "./member-form-dialog"
import type { MemberDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { MemberDetailsDialog } from "./member-details-dialog"
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
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [detailsMember, setDetailsMember] = useState<MemberDto | null>(null)

  const handleEdit = (member: MemberDto) => {
    setEditingMember(member)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingMember(null)
  }

  // Handing over from the details dialog: it closes first, so the two are
  // never stacked, and only reopens if the caller goes back to it.
  const handOff = (run: (member: MemberDto) => void) => {
    const member = detailsMember
    if (!member) return
    setDetailsMember(null)
    run(member)
  }

  const columns = createColumns({ onDetails: setDetailsMember, onEdit: handleEdit, companyNames })

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
      {isFormOpen && (
        <MemberFormDialog
          key={editingMember?.id || "create"}
          isOpen
          onClose={handleClose}
          editingMember={editingMember}
          companyNames={companyNames}
        />
      )}
      {detailsMember && (
        <MemberDetailsDialog
          key={detailsMember.id}
          member={detailsMember}
          open
          onOpenChange={(next) => {
            if (!next) setDetailsMember(null)
          }}
          onEdit={() => handOff(handleEdit)}
        />
      )}
    </>
  )
}
