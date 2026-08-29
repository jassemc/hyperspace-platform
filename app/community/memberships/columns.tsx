"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { MembershipDto, MembershipStatus } from "@/lib/service/HsService"
import { ArrowUpDown } from "lucide-react"
import { formatDate } from "@/lib/format"
import { MEMBERSHIP_STATUS_CLASSES, MEMBERSHIP_STATUS_LABELS } from "./membership-status"
import { MembershipRowActions } from "./membership-row-actions"

interface ColumnsProps {
  onDetails: (membership: MembershipDto) => void
  onEdit: (membership: MembershipDto) => void
}

export const createColumns = ({ onDetails, onEdit }: ColumnsProps): ColumnDef<MembershipDto>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Membership
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const membership = row.original
      const planName = membership.plan?.name
      return (
        <div className="flex flex-col">
          <span>{membership.name}</span>
          {planName && <span className="text-xs text-muted-foreground">{planName}</span>}
        </div>
      )
    },
  },
  {
    id: "customer",
    // A membership belongs to a member XOR a company.
    accessorFn: (membership) => membership.member?.fullName ?? membership.company?.name ?? "",
    header: "Customer",
    cell: ({ row }) => {
      const membership = row.original
      const value = row.getValue<string>("customer")
      if (!value) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex flex-col">
          <span>{value}</span>
          <span className="text-xs text-muted-foreground">
            {membership.company ? "Company" : "Member"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "startsAt",
    header: "Term",
    cell: ({ row }) => {
      const membership = row.original
      return (
        <div className="flex flex-col">
          <span>{formatDate(membership.startsAt)}</span>
          <span className="text-xs text-muted-foreground">
            {membership.endsAt ? `until ${formatDate(membership.endsAt)}` : "open-ended"}
          </span>
        </div>
      )
    },
  },
  {
    id: "discount",
    accessorFn: (membership) => membership.discount?.code ?? "",
    header: "Discount",
    cell: ({ row }) => {
      const code = row.getValue<string>("discount")
      if (!code) return <span className="text-muted-foreground">-</span>
      return <code className="rounded bg-muted px-1 text-xs">{code}</code>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<MembershipStatus>("status")
      if (!value) return <span className="text-muted-foreground">-</span>
      return (
        <Badge variant="secondary" className={`${MEMBERSHIP_STATUS_CLASSES[value] ?? ""} border-0`}>
          {MEMBERSHIP_STATUS_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
  {
    accessorKey: "cancelledAt",
    header: "Cancelled",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("cancelledAt")
      return value ? <span>{formatDate(value)}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => <span>{formatDate(row.getValue<string>("createdAt"))}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <MembershipRowActions membership={row.original} onDetails={onDetails} onEdit={onEdit} />
    ),
  },
]
