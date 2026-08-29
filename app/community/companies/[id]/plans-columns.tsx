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
  onDetails: (membership: MembershipDto) => void
  onEdit: (membership: MembershipDto) => void
  actions?: MembershipActions
}

export const createPlanColumns = ({
  companyId,
  onDetails,
  onEdit,
  actions,
}: ColumnsProps): ColumnDef<MembershipDto>[] => [
  {
    id: "name",
    header: "Plan",
    cell: ({ row }) => <span className="font-medium">{row.original.plan.name}</span>,
  },
  {
    id: "subscriber",
    header: "Subscriber",
    cell: ({ row }) => {
      const membership = row.original
      const subscriber = membership.member?.fullName ?? membership.company?.name
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
