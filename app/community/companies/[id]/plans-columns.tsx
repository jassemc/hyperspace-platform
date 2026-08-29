"use client"

import { Badge } from "@/components/ui/badge"
import type { MembershipDto, MembershipStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/format"
import { MEMBERSHIP_STATUS_CLASSES, MEMBERSHIP_STATUS_LABELS } from "@/app/community/memberships/membership-status"
import { MembershipRowActions } from "@/app/community/memberships/membership-row-actions"
import type { MembershipActions } from "@/app/community/memberships/use-membership-mutations"

interface ColumnsProps {
  companyId: string
  plansById: Record<string, string>
  subscribersById: Record<string, string>
  onDetails: (membership: MembershipDto) => void
  onEdit: (membership: MembershipDto) => void
  actions?: MembershipActions
}

export const createPlanColumns = ({
  companyId,
  plansById,
  subscribersById,
  onDetails,
  onEdit,
  actions,
}: ColumnsProps): ColumnDef<MembershipDto>[] => [
  {
    id: "name",
    accessorKey: "planId",
    header: "Plan",
    cell: ({ row }) => {
      const planId = row.getValue<string>("name")
      return <span className="font-medium">{plansById[planId] || planId}</span>
    },
    // The cell holds a planId, so the shared search box has to match the
    // resolved names instead of the raw accessor value. Mirrors the server-side
    // filter in plans-tab.tsx so both passes agree.
    filterFn: (row, id, value) => {
      const planId = row.getValue<string>(id)
      const planName = plansById[planId] || planId
      const subscriber = subscribersById[row.original.id] ?? ""
      const needle = String(value).toLowerCase()
      return (
        planName.toLowerCase().includes(needle) || subscriber.toLowerCase().includes(needle)
      )
    },
  },
  {
    id: "subscriber",
    header: "Subscriber",
    cell: ({ row }) => {
      const membership = row.original
      const subscriber = subscribersById[membership.id]
      if (!subscriber) return <span>-</span>

      return (
        <div className="flex items-center gap-2">
          <span>{subscriber}</span>
          {!membership.memberId && (
            <Badge variant="outline" className="text-xs">
              Company
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<MembershipStatus>("status")
      if (!value) return <span>-</span>

      return (
        <Badge variant="secondary" className={`${MEMBERSHIP_STATUS_CLASSES[value] ?? ""} border-0`}>
          {MEMBERSHIP_STATUS_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
  {
    accessorKey: "startsAt",
    header: "Starts",
    cell: ({ row }) => <span>{formatDate(row.getValue<string>("startsAt"))}</span>,
  },
  {
    accessorKey: "endsAt",
    header: "Ends",
    cell: ({ row }) => <span>{formatDate(row.getValue<string | null>("endsAt"))}</span>,
  },
  {
    accessorKey: "cancelledAt",
    header: "Cancelled",
    cell: ({ row }) => <span>{formatDate(row.getValue<string | null>("cancelledAt"))}</span>,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <span>{row.getValue<string | null>("notes") || "-"}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <MembershipRowActions
        membership={row.original}
        onDetails={onDetails}
        onEdit={onEdit}
        actions={actions}
        companyId={companyId}
      />
    ),
  },
]
