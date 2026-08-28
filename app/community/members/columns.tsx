"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "./member-status"
import { StatusButton } from "./status-button"

interface ColumnsProps {
  onEdit: (member: MemberDto) => void
  companyNames?: Record<string, string>
}

export const createColumns = ({ onEdit, companyNames = {} }: ColumnsProps): ColumnDef<MemberDto>[] => [
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
    cell: ({ row }) => {
      const member = row.original
      // Employers are referenced by id only. One outside the looked-up page
      // still reads as employed rather than silently as solo.
      const company = member.companyId
        ? companyNames[member.companyId] ?? "Unknown company"
        : null

      return (
        <div className="flex flex-col">
          <span>{member.fullName}</span>
          {company && (
            <span className="text-xs text-muted-foreground">{company}</span>
          )}
        </div>
      )
    },
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
    id: "company",
    // Members reference their employer by id only.
    accessorFn: (member) => (member.companyId ? companyNames[member.companyId] ?? "" : ""),
    header: "Company",
    cell: ({ row }) => {
      const member = row.original
      if (!member.companyId) return <span className="text-muted-foreground">Solo</span>
      return (
        <div className="flex flex-col">
          <span>{row.getValue<string>("company") || "Unknown company"}</span>
          {(member.isBillingPerson || member.isContactPerson) && (
            <span className="flex gap-1 pt-0.5">
              {member.isBillingPerson && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  Billing
                </Badge>
              )}
              {member.isContactPerson && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  Contact
                </Badge>
              )}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "kindHint",
    header: "Kind",
    cell: ({ row }) => {
      const value = row.getValue<string>("kindHint")
      return <span className="capitalize">{value ? formatEnumLabel(value) : "-"}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<MemberStatus>("status")
      if (!value) return <span className="text-muted-foreground">-</span>

      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className={`${MEMBER_STATUS_CLASSES[value] ?? ""} border-0`}>
            {MEMBER_STATUS_LABELS[value] ?? formatEnumLabel(value)}
          </Badge>
          {/* A pinned status was set by staff rather than derived from activity. */}
          {row.original.statusOverride && (
            <span className="text-[10px] text-muted-foreground" title="Manually pinned">
              pinned
            </span>
          )}
        </div>
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
          <StatusButton
            memberId={member.id}
            memberName={member.fullName}
            statusOverride={member.statusOverride}
          />
        </div>
      )
    },
  },
]
