"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "./member-status"
import { MemberRowActions } from "./member-row-actions"

interface ColumnsProps {
  onDetails: (member: MemberDto) => void
  onEdit: (member: MemberDto) => void
}

export const createColumns = ({ onDetails, onEdit }: ColumnsProps): ColumnDef<MemberDto>[] => [
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
      const company = member.companyId
        ? member.company?.name || "Unknown company"
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
    accessorFn: (member) => (member.companyId ? member.company?.name ?? "" : ""),
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
    cell: ({ row }) => (
      <MemberRowActions member={row.original} onDetails={onDetails} onEdit={onEdit} />
    ),
  },
]
