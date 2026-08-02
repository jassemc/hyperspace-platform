"use client"

import { Badge } from "@/components/ui/badge"
import type { MembershipDto, MembershipStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { CancelMembershipButton, RenewMembershipButton } from "./membership-action-buttons"

function statusBadgeClass(status: MembershipStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
    case "pending":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
    case "paused":
      return "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200"
    case "ended":
      return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
  }
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

interface ColumnsProps {
  companyId: string
  plansById: Record<string, string>
  subscribersById: Record<string, string>
}

export const createPlanColumns = ({
  companyId,
  plansById,
  subscribersById,
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
        <Badge variant="secondary" className={`${statusBadgeClass(value)} border-0 capitalize`}>
          {value}
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
    cell: ({ row }) => {
      const membership = row.original
      const planName = plansById[membership.planId] || membership.planId

      return (
        <div className="flex items-center gap-2">
          <RenewMembershipButton
            membershipId={membership.id}
            planName={planName}
            companyId={companyId}
          />
          <CancelMembershipButton
            membershipId={membership.id}
            planName={planName}
            companyId={companyId}
            isCancelled={Boolean(membership.cancelledAt)}
          />
        </div>
      )
    },
  },
]
