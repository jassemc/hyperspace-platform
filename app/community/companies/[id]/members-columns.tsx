"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { ReassignMemberButton } from "./reassign-member-button"

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

interface ColumnsProps {
  companyId: string
}

export const createMemberColumns = ({ companyId }: ColumnsProps): ColumnDef<MemberDto>[] => [
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
      <span className="capitalize">{formatLabel(row.getValue<string>("kindHint") || "-")}</span>
    ),
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ReassignMemberButton
          memberId={row.original.id}
          memberName={row.original.fullName}
          currentCompanyId={companyId}
        />
      </div>
    ),
  },
]
