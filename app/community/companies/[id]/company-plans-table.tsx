"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { MembershipDetailsDialog } from "@/app/community/memberships/membership-details-dialog"
import { MembershipFormDialog } from "@/app/community/memberships/membership-form-dialog"
import type { MembershipActions } from "@/app/community/memberships/use-membership-mutations"
import { MEMBERSHIP_STATUS_TABS } from "@/app/community/memberships/membership-status"
import { membershipTotals } from "@/app/community/memberships/stats"
import type { MembershipDto, MembershipStatsDto, MembershipStatus } from "@/lib/service/HsService"
import { createPlanColumns } from "./plans-columns"
import {
  cancelCompanyMembershipAction,
  renewCompanyMembershipAction,
  pauseCompanyMembershipAction,
  resumeCompanyMembershipAction,
} from "./actions"

// The memberships module owns the lifecycle actions; these wrappers just
// also revalidate the company page, since that's what the user is looking at.
const COMPANY_ACTIONS: MembershipActions = {
  cancel: cancelCompanyMembershipAction, renew: renewCompanyMembershipAction,
  pause: pauseCompanyMembershipAction, resume: resumeCompanyMembershipAction,
}

interface CompanyPlansTableProps {
  data: MembershipDto[]
  totalCount?: number
  companyId: string
  activeStatus?: MembershipStatus
  stats?: MembershipStatsDto | null
}

export function CompanyPlansTable({
  data,
  totalCount,
  companyId,
  activeStatus,
  stats,
}: Readonly<CompanyPlansTableProps>) {
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

  const columns = createPlanColumns({
    companyId,
    onDetails: setDetailsMembership,
    onEdit: handleEdit,
    actions: COMPANY_ACTIONS,
  })

  const totals = membershipTotals(stats ?? null)

  return (
    <>
      {/* Remount on status change so pagination is re-read from the URL. */}
      <DataTable
        key={activeStatus ?? "all"}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        showStatusTabs
        statusTabOptions={MEMBERSHIP_STATUS_TABS.map((tab) => ({
          ...tab,
          count: totals.countFor(tab.value),
        }))}
        statusAllCount={totals.total}
        serverSearch
        searchPlaceholder="Search plans..."
      />
      {isFormOpen && (
        <MembershipFormDialog
          key={editingMembership?.id || "create"}
          isOpen
          onClose={handleClose}
          editingMembership={editingMembership}
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
          actions={COMPANY_ACTIONS}
          companyId={companyId}
        />
      )}
    </>
  )
}
