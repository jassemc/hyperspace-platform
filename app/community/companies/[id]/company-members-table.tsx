"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { MemberDetailsDialog } from "@/app/community/members/member-details-dialog"
import { MemberFormDialog } from "@/app/community/members/member-form-dialog"
import type { MemberDto } from "@/lib/service/HsService"
import { createMemberColumns } from "./members-columns"
import { ReassignMemberDialog } from "./reassign-member-dialog"

interface CompanyMembersTableProps {
  data: MemberDto[]
  totalCount?: number
  companyId: string
  companyName: string
}

export function CompanyMembersTable({
  data,
  totalCount,
  companyId,
  companyName,
}: Readonly<CompanyMembersTableProps>) {
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [detailsMember, setDetailsMember] = useState<MemberDto | null>(null)
  const [reassign, setReassign] = useState<{ member: MemberDto; detach: boolean } | null>(null)

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

  const columns = createMemberColumns({
    companyId,
    onDetails: setDetailsMember,
    onEdit: handleEdit,
    onReassign: (member) => setReassign({ member, detach: false }),
    onDetach: (member) => setReassign({ member, detach: true }),
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      {isFormOpen && (
        <MemberFormDialog
          key={editingMember?.id || "create"}
          isOpen
          onClose={handleClose}
          editingMember={editingMember}
          companyNames={{ [companyId]: companyName }}
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
      {reassign && (
        <ReassignMemberDialog
          key={reassign.member.id}
          open
          onOpenChange={(next) => {
            if (!next) setReassign(null)
          }}
          member={reassign.member}
          currentCompanyId={companyId}
          detach={reassign.detach}
          onDone={() => setReassign(null)}
        />
      )}
    </>
  )
}
