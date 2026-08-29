"use client"

import { Badge } from "@/components/ui/badge"
import type { MemberDto, MemberStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "./member-status"
import { MemberRowActions } from "./member-row-actions"

interface ColumnsProps {
  onDetails: (member: MemberDto) => void
  onEdit: (member: MemberDto) => void
}

/**
 * Six columns, each answering one question: who (name + segment), how to
 * reach them, who employs them, where they stand, since when, and what to
 * do. Email and phone share a cell — either is often blank — and the
 * company is named once, in its own column. Kind is not a column: it is
 * the inline filter, and the derived status already says more.
 */
export const createColumns = ({ onDetails, onEdit }: ColumnsProps): ColumnDef<MemberDto>[] => [
  {
    id: "name",
    accessorKey: "fullName",
    header: "Member",
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex flex-col">
          {/* The name opens the details — the row's most common action,
              one click instead of a trip through the "⋯" menu. */}
          <button
            type="button"
            onClick={() => onDetails(member)}
            className="rounded-sm text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {member.fullName}
          </button>
          {member.segment && (
            <span className="text-xs capitalize text-muted-foreground">
              {formatEnumLabel(member.segment)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: "contact",
    accessorFn: (member) => [member.email, member.phone].filter(Boolean).join(" "),
    header: "Contact",
    cell: ({ row }) => {
      const { email, phone } = row.original
      if (!email && !phone) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex flex-col">
          {email && (
            <a href={`mailto:${email}`} className="text-primary hover:underline">
              {email}
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className={email ? "text-xs text-muted-foreground hover:underline" : "text-primary hover:underline"}
            >
              {phone}
            </a>
          )}
        </div>
      )
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
