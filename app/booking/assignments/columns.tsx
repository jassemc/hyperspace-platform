"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { AssignmentDto, ResourceDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import { AssignmentActionButtons } from "./assignment-actions-buttons"

interface ColumnsProps {
  resourceNames?: Record<string, string>
  membershipNames?: Record<string, string>
  resources?: ResourceDto[]
}

/** Open-ended, or ended once the exclusive end date has passed. */
function isActive(assignment: AssignmentDto): boolean {
  if (!assignment.endsAt) return true
  return new Date(assignment.endsAt).getTime() > Date.now()
}

export const createColumns = ({
  resourceNames = {},
  membershipNames = {},
  resources = [],
}: ColumnsProps): ColumnDef<AssignmentDto>[] => [
  {
    id: "resource",
    accessorFn: (assignment) => resourceNames[assignment.resourceId] ?? "",
    header: "Resource",
    cell: ({ row }) => {
      const value = row.getValue<string>("resource")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">Unknown</span>
    },
  },
  {
    id: "membership",
    accessorFn: (assignment) => membershipNames[assignment.membershipId] ?? "",
    header: "Membership",
    cell: ({ row }) => {
      const value = row.getValue<string>("membership")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "startsAt",
    header: "Term",
    cell: ({ row }) => {
      const assignment = row.original
      return (
        <div className="flex flex-col">
          <span>{formatDate(assignment.startsAt)}</span>
          <span className="text-xs text-muted-foreground">
            {assignment.endsAt ? `until ${formatDate(assignment.endsAt)}` : "open-ended"}
          </span>
        </div>
      )
    },
  },
  {
    id: "state",
    accessorFn: (assignment) => (isActive(assignment) ? "active" : "ended"),
    header: "State",
    cell: ({ row }) => {
      const active = isActive(row.original)
      return (
        <Badge
          variant="secondary"
          className={
            active
              ? "border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "border-0 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }
        >
          {active ? "Active" : "Ended"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("notes")
      return value ? <span className="text-sm">{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const assignment = row.original
      if (!isActive(assignment)) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-2">
          <AssignmentActionButtons
            assignmentId={assignment.id}
            resourceName={resourceNames[assignment.resourceId] ?? "this resource"}
            resources={resources}
          />
        </div>
      )
    },
  },
]
