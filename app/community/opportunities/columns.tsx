"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { OpportunityDto, OpportunityInterest, OpportunityStage } from "@/lib/service/HsService"
import { formatCalendarDate, formatDate, formatPriceHt } from "@/lib/format"
import type { OptionsLoading } from "./use-opportunity-options"
import { apiNumber, apiString } from "@/lib/api-value"
import { OpportunityRowActions } from "./opportunity-row-actions"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_STAGE_CLASSES,
  OPPORTUNITY_STAGE_LABELS,
  opportunityValue,
  valueBreakdown,
} from "./opportunity-meta"

interface ColumnsProps {
  onDetails: (opportunity: OpportunityDto) => void
  onEdit: (opportunity: OpportunityDto) => void
  onConvert: (opportunity: OpportunityDto) => void
  /** The row and the button waiting on data, if any. */
  loading?: OptionsLoading | null
}

export const createColumns = ({
  onDetails,
  onEdit,
  onConvert,
  loading = null,
}: ColumnsProps): ColumnDef<OpportunityDto>[] => [
  {
    id: "member",
    // The row names its own member now; no lookup table, no "Unknown" past
    // the first hundred.
    accessorFn: (opportunity) => opportunity.member?.fullName ?? "",
    header: "Member",
    cell: ({ row }) => {
      const member = row.original.member
      if (!member?.fullName) {
        return <span className="text-muted-foreground">Unknown</span>
      }
      return (
        <div className="flex flex-col">
          <span>{member.fullName}</span>
          {member.email && (
            <span className="text-xs text-muted-foreground">{member.email}</span>
          )}
        </div>
      )
    },
  },
  {
    id: "requested",
    header: "Requested",
    cell: ({ row }) => {
      const { requestedPlan, requestedResource } = row.original
      // The day the visitor asked for — a trial day, a meeting, a move-in.
      const requestedDate = apiString(row.original.requestedDate)
      const hasPlanOrSpace = Boolean(requestedPlan || requestedResource)
      if (!hasPlanOrSpace && !requestedDate) {
        return <span className="text-muted-foreground">-</span>
      }
      return (
        <div className="flex flex-col">
          {hasPlanOrSpace && (
            <>
              <span>{requestedPlan?.name ?? "No plan"}</span>
              <span className="text-xs text-muted-foreground">
                {requestedResource?.name ?? "Space to assign"}
              </span>
            </>
          )}
          {requestedDate && (
            <span className={hasPlanOrSpace ? "text-xs text-muted-foreground" : undefined}>
              {formatCalendarDate(requestedDate)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "interest",
    header: "Interest",
    cell: ({ row }) => {
      const value = row.getValue<OpportunityInterest>("interest")
      return (
        <Badge variant="outline" className="font-normal">
          {OPPORTUNITY_INTEREST_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const value = row.getValue<OpportunityStage>("stage")
      return (
        <Badge variant="secondary" className={`${OPPORTUNITY_STAGE_CLASSES[value] ?? ""} border-0`}>
          {OPPORTUNITY_STAGE_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
  {
    id: "expectedValue",
    accessorFn: (opportunity) => apiNumber(opportunity.expectedValue) ?? 0,
    header: "Expected value",
    cell: ({ row }) => {
      // Shared with the details dialog, so the two cannot disagree.
      const value = opportunityValue(row.original)
      if (value.total === null) {
        return <span className="text-muted-foreground">-</span>
      }
      const breakdown = valueBreakdown(value)

      return (
        <div className="flex flex-col">
          <span>{formatPriceHt(value.total)}</span>
          {breakdown && (
            <span className="text-xs text-muted-foreground">{breakdown}</span>
          )}
        </div>
      )
    },
  },
  {
    id: "source",
    accessorFn: (opportunity) => apiString(opportunity.source) ?? "",
    header: "Source",
    cell: ({ row }) => {
      const value = row.getValue<string>("source")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    id: "code",
    accessorFn: (opportunity) => apiString(opportunity.requestedDiscountCode) ?? "",
    header: "Code",
    cell: ({ row }) => {
      const value = row.getValue<string>("code")
      if (!value) return <span className="text-muted-foreground">-</span>
      return <code className="rounded bg-muted px-1 text-xs">{value}</code>
    },
  },
  {
    accessorKey: "closedAt",
    header: "Closed",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("closedAt")
      return value ? <span>{formatDate(value)}</span> : <span className="text-muted-foreground">Open</span>
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
      <OpportunityRowActions
        opportunity={row.original}
        onDetails={onDetails}
        onEdit={onEdit}
        onConvert={onConvert}
        loading={loading}
      />
    ),
  },
]
