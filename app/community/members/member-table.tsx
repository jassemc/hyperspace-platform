"use client"

import { useState } from "react"
import { DataTable, type TableFilter } from "@/components/data-table"
import { MemberFormDialog } from "./member-form-dialog"
import type { MemberDto, MemberKindHint, MemberStatsDto, MemberStatus } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { MemberDetailsDialog } from "./member-details-dialog"
import { MEMBER_KIND_TABS, MEMBER_STATUS_TABS } from "./member-status"
import { memberTotals } from "./totals"

interface MemberTableProps {
  data: MemberDto[]
  totalCount?: number
  stats?: MemberStatsDto | null
  activeStatus?: MemberStatus
  activeKindHint?: MemberKindHint
  /** ISO instants owned by the Created range filter. */
  activeCreatedFrom?: string
  activeCreatedTo?: string
}

export function MemberTable({
  data,
  totalCount,
  stats,
  activeStatus,
  activeKindHint,
  activeCreatedFrom,
  activeCreatedTo,
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

  const columns = createColumns({ onDetails: setDetailsMember, onEdit: handleEdit })

  const totals = memberTotals(stats ?? null)

  const filters: TableFilter[] = [
    {
      key: "kindHint",
      label: "Kind",
      value: activeKindHint,
      options: MEMBER_KIND_TABS.map((tab) => ({
        ...tab,
        count: totals.kindCount(tab.value),
      })),
    },
    {
      kind: "dateRange",
      label: "Created",
      fromKey: "createdFrom",
      toKey: "createdTo",
      fromValue: activeCreatedFrom,
      toValue: activeCreatedTo,
      presets: [
        { label: "Today", days: 0 },
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
      ],
    },
  ]

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeStatus ?? "all"}-${activeKindHint ?? "any"}-${activeCreatedFrom ?? ""}-${activeCreatedTo ?? ""}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        filters={filters}
        showStatusTabs={true}
        statusTabOptions={MEMBER_STATUS_TABS.map((tab) => ({
          ...tab,
          count: totals.countFor(tab.value),
        }))}
        statusAllCount={totals.total}
        serverSearch
        inlineFilters
        searchPlaceholder="Search members..."
      />
      {isFormOpen && (
        <MemberFormDialog
          key={editingMember?.id || "create"}
          isOpen
          onClose={handleClose}
          editingMember={editingMember}
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
