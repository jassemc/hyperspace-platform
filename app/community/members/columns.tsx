"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit } from "lucide-react"
import { InviteButton } from "./invite-button"
import { UnlinkButton } from "./unlink-button"

interface ColumnsProps {
  onEdit: (member: MemberDto) => void
}

function statusBadgeClass(status: MemberStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
    case "lead":
      return "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200"
    case "drop-in":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
    case "pending":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
    case "former":
      return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
  }
}

function formatLabel(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ")
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<MemberDto>[] => [
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
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("email")
      return <span>{value || "-"}</span>
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("phone")
      return <span>{value || "-"}</span>
    },
  },
  {
    accessorKey: "kindHint",
    header: "Kind",
    cell: ({ row }) => {
      const value = row.getValue<string>("kindHint")
      return <span className="capitalize">{formatLabel(value)}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<MemberStatus>("status")
      if (!value) return <span>-</span>

      return (
        <Badge variant="secondary" className={`${statusBadgeClass(value)} border-0 capitalize`}>
          {formatLabel(value)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "hasPortalAccess",
    header: "Portal",
    cell: ({ row }) => {
      const hasAccess = row.getValue<boolean>("hasPortalAccess")
      return (
        <Badge variant={hasAccess ? "default" : "outline"}>
          {hasAccess ? "Linked" : "None"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const value = row.getValue<string>("createdAt")
      const date = value ? new Date(value) : null
      return <span>{date ? date.toLocaleDateString() : "-"}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(member)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <InviteButton
            memberId={member.id}
            memberName={member.fullName}
            hasPortalAccess={member.hasPortalAccess}
          />
          <UnlinkButton
            memberId={member.id}
            memberName={member.fullName}
            hasPortalAccess={member.hasPortalAccess}
          />
        </div>
      )
    },
  },
]
