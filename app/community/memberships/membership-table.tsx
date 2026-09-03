"use client"

import { useState } from "react"
import { DataTable, type TableFilter } from "@/components/data-table"
import type {
  MembershipDto,
  MembershipPlanCountDto,
  MembershipStatsDto,
  MembershipStatus,
} from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { MembershipFormDialog } from "./membership-form-dialog"
import { MembershipDetailsDialog } from "./membership-details-dialog"
import { MEMBERSHIP_STATUS_TABS } from "./membership-status"
import { membershipTotals } from "./totals"

interface MembershipTableProps {
  data: MembershipDto[]
  totalCount?: number
  stats?: MembershipStatsDto | null
  // The full, unfiltered-by-plan `byPlan` list, so the Plan select keeps
  // every option even once a plan is picked and `stats` narrows to it.
  planOptions?: MembershipPlanCountDto[] | null
  activeStatus?: MembershipStatus
  activePlanId?: string
  /** Member page: every row is theirs, so no Customer column and no Plan filter. */
  hideCustomer?: boolean
  showPlanFilter?: boolean
  /** Forwarded to the create dialog so the member select starts on them. */
  defaultMemberId?: string
}

export function MembershipTable({
  data,
  totalCount,
  stats,
  planOptions,
  activeStatus,
  activePlanId,
  hideCustomer = false,
  showPlanFilter = true,
  defaultMemberId,
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

  const columns = createColumns({ onDetails: setDetailsMembership, onEdit: handleEdit, hideCustomer })

  const totals = membershipTotals(stats ?? null)

  const filters: TableFilter[] = [
    {
      key: "planId",
      label: "Plan",
      value: activePlanId,
      options: (planOptions ?? totals.plans).map((plan) => ({
        value: plan.planId,
        label: plan.name,
        count: plan.count,
      })),
    },
  ]

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeStatus ?? "all"}-${activePlanId ?? "any"}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        filters={showPlanFilter ? filters : []}
        showStatusTabs={true}
        statusTabOptions={MEMBERSHIP_STATUS_TABS.map((tab) => ({
          ...tab,
          count: totals.countFor(tab.value),
        }))}
        statusAllCount={totals.total}
        serverSearch
        inlineFilters
        searchPlaceholder="Search memberships..."
      />
      {isFormOpen && (
        <MembershipFormDialog
          key={editingMembership?.id || "create"}
          isOpen
          onClose={handleClose}
          editingMembership={editingMembership}
          defaultMemberId={defaultMemberId}
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
