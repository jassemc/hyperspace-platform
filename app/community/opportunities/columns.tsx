"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { OpportunityDto, OpportunityInterest, OpportunityStage } from "@/lib/service/HsService"
import { Edit } from "lucide-react"
import { formatDate, formatPriceHt } from "@/lib/format"
import { apiNumber, apiString } from "@/lib/api-value"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_STAGE_CLASSES,
  OPPORTUNITY_STAGE_LABELS,
} from "./opportunity-meta"

interface ColumnsProps {
  onEdit: (opportunity: OpportunityDto) => void
  memberNames?: Record<string, string>
}

export const createColumns = ({
  onEdit,
  memberNames = {},
}: ColumnsProps): ColumnDef<OpportunityDto>[] => [
  {
    id: "member",
    accessorFn: (opportunity) => memberNames[opportunity.memberId] ?? "",
    header: "Member",
    cell: ({ row }) => {
      const value = row.getValue<string>("member")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">Unknown</span>
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
      const value = apiNumber(row.original.expectedValue)
      return value === null ? (
        <span className="text-muted-foreground">-</span>
      ) : (
        <span>{formatPriceHt(value)}</span>
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(row.original)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
