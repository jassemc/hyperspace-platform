"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { OpportunityDto, OpportunityInterest, OpportunityStage } from "@/lib/service/HsService"
import { Edit, Loader2, UserPlus } from "lucide-react"
import { formatDate, formatPriceHt } from "@/lib/format"
import type { OpportunityAction, OptionsLoading } from "./use-opportunity-options"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { apiNumber, apiString } from "@/lib/api-value"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_STAGE_CLASSES,
  OPPORTUNITY_STAGE_LABELS,
} from "./opportunity-meta"

interface ColumnsProps {
  onEdit: (opportunity: OpportunityDto) => void
  onConvert: (opportunity: OpportunityDto) => void
  /** The row and the button waiting on data, if any. */
  loading?: OptionsLoading | null
}

/** Why the conversion is unavailable matters more than that it is. */
function convertHint(closed: boolean, hasPlan: boolean): string {
  if (closed) return "Already closed — reopen it to convert"
  if (!hasPlan) return "Add a requested plan before converting"
  return "Convert to a membership and assignment"
}

export const createColumns = ({
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
      if (!requestedPlan && !requestedResource) {
        return <span className="text-muted-foreground">-</span>
      }
      return (
        <div className="flex flex-col">
          <span>{requestedPlan?.name ?? "No plan"}</span>
          <span className="text-xs text-muted-foreground">
            {requestedResource?.name ?? "Space to assign"}
          </span>
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
      const opportunity = row.original
      const value = apiNumber(opportunity.expectedValue)
      const extras = opportunity.requestedExtras ?? []
      const extrasTotal = extras.reduce((sum, extra) => sum + extra.priceHt, 0)
      // The quote if one was given, otherwise what the plan itself costs.
      const planFee =
        apiNumber(opportunity.requestedPlanPriceHt) ??
        opportunity.requestedPlan?.priceHt ??
        null

      if (value === null && planFee === null && extras.length === 0) {
        return <span className="text-muted-foreground">-</span>
      }

      // Says what the figure is made of, so a total nobody recognises can be
      // traced back to the plan fee and the add-ons that make it up.
      const breakdown =
        planFee === null
          ? null
          : `${formatPriceHt(planFee)} plan${
              extras.length > 0
                ? ` + ${extras.length} add-on${extras.length > 1 ? "s" : ""} (${formatPriceHt(extrasTotal)})`
                : ""
            }`

      return (
        <div className="flex flex-col">
          <span>{formatPriceHt(value ?? (planFee ?? 0) + extrasTotal)}</span>
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
    cell: ({ row }) => {
      const opportunity = row.original
      const busy = loading !== null
      const waitingOn = (action: OpportunityAction) =>
        loading?.action === action && loading.id === opportunity.id
      // Converting a closed lead is refused: won/lost stamps closed_at.
      const closed = Boolean(opportunity.closedAt)
      // No plan, nothing to bill — onboarding refuses it. Shown but disabled,
      // so the action stays discoverable and the tooltip says what is missing.
      const hasPlan = Boolean(apiString(opportunity.requestedPlanId))

      return (
        <div className="flex items-center gap-2">
          <Tooltip>
            {/* A disabled button fires no pointer events, so the span carries
                the trigger — the reason matters most when it is disabled. */}
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(opportunity)}
                  disabled={busy}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
                >
                  {waitingOn("edit") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                  <span className="sr-only">Edit</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Edit this opportunity</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConvert(opportunity)}
                  disabled={busy || closed || !hasPlan}
                  className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 dark:border-green-800"
                >
                  {waitingOn("convert") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="sr-only">Convert</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{convertHint(closed, hasPlan)}</TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]
