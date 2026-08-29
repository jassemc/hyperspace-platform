"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { MembershipDto, MembershipStatus, PlanDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { MembershipFormDialog } from "./membership-form-dialog"
import { MembershipDetailsDialog } from "./membership-details-dialog"
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<MembershipDto | null>(null)
  const [detailsMembership, setDetailsMembership] = useState<MembershipDto | null>(null)

  const handleEdit = (membership: MembershipDto) => {
    setEditingMembership(membership)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingMembership(null)
  }

  // Handing over from the details dialog: it closes first, so the two are
  // never stacked, and only reopens if the caller goes back to it.
  const handOff = (run: (membership: MembershipDto) => void) => {
    const membership = detailsMembership
    if (!membership) return
    setDetailsMembership(null)
    run(membership)
  }

  const columns = createColumns({ onDetails: setDetailsMembership, onEdit: handleEdit, memberNames, companyNames })

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
        serverSearch
        searchPlaceholder="Search memberships..."
      />
      {isFormOpen && (
        <MembershipFormDialog
          key={editingMembership?.id || "create"}
          isOpen
          onClose={handleClose}
          editingMembership={editingMembership}
          memberNames={memberNames}
          companyNames={companyNames}
          plans={plans}
        />
      )}
      {detailsMembership && (
        <MembershipDetailsDialog
          key={detailsMembership.id}
          membership={detailsMembership}
          open
          onOpenChange={(next) => {
            if (!next) setDetailsMembership(null)
          }}
          onEdit={() => handOff(handleEdit)}
        />
      )}
    </>
  )
}
