"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { MemberFormDialog } from "@/app/community/members/member-form-dialog"
import type { MemberDto } from "@/lib/service/HsService"
import { createMemberColumns } from "./members-columns"
import { ReassignMemberDialog } from "./reassign-member-dialog"
import { memberPath } from "@/app/community/members/[id]/member-route"

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
  const router = useRouter()
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [reassign, setReassign] = useState<{ member: MemberDto; detach: boolean } | null>(null)

  const handleEdit = (member: MemberDto) => {
    setEditingMember(member)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingMember(null)
  }


  const columns = createMemberColumns({
    // Details is the member's own page now; the company page keeps only
    // what is about the employment (edit, move, detach).
    onDetails: (member) => router.push(memberPath(member.id)),
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
