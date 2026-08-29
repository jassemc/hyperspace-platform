"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "@/app/community/members/member-status"
import { CompanyMemberRowActions } from "./company-member-row-actions"
import { memberPath } from "@/app/community/members/[id]/member-route"

interface ColumnsProps {
  onDetails: (member: MemberDto) => void
  onEdit: (member: MemberDto) => void
  onReassign: (member: MemberDto) => void
  onDetach: (member: MemberDto) => void
}

export const createMemberColumns = ({
  onDetails,
  onEdit,
  onReassign,
  onDetach,
}: ColumnsProps): ColumnDef<MemberDto>[] => [
  {
    id: "name",
    accessorKey: "fullName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={memberPath(row.original.id)} className="font-medium hover:underline">
        {row.original.fullName}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span>{row.getValue<string | null>("email") || "-"}</span>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span>{row.getValue<string | null>("phone") || "-"}</span>,
  },
  {
    accessorKey: "kindHint",
    header: "Kind",
    cell: ({ row }) => (
      <span className="capitalize">{formatEnumLabel(row.getValue<string>("kindHint") || "-")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<MemberStatus>("status")
      if (!value) return <span>-</span>

      return (
        <Badge variant="secondary" className={`${MEMBER_STATUS_CLASSES[value] ?? ""} border-0`}>
          {MEMBER_STATUS_LABELS[value] ?? formatEnumLabel(value)}
        </Badge>
      )
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
      <CompanyMemberRowActions
        member={row.original}
        onDetails={onDetails}
        onEdit={onEdit}
        onReassign={onReassign}
        onDetach={onDetach}
      />
    ),
  },
]
