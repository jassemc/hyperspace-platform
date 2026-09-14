"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { CheckinDto } from "@/lib/service/HsService"
import { formatEnumLabel } from "@/lib/format"
import { CheckoutButton } from "./checkout-button"

interface ColumnsProps {
  /** Off on a member's own page, where every row is theirs. */
  hideMember?: boolean
  locationNames?: Record<string, string>
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString()
}

/** Minutes between check-in and check-out, or since check-in when still open. */
function duration(checkin: CheckinDto): string {
  const start = new Date(checkin.checkedInAt).getTime()
  const end = checkin.checkedOutAt ? new Date(checkin.checkedOutAt).getTime() : Date.now()
  if (Number.isNaN(start) || Number.isNaN(end)) return "-"
  const minutes = Math.max(0, Math.round((end - start) / 60000))
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

export const createColumns = ({
  locationNames = {},
  hideMember = false,
}: ColumnsProps): ColumnDef<CheckinDto>[] => {
  const columns: ColumnDef<CheckinDto>[] = [
  {
    id: "member",
    // #85 (O-02): the name travels on the row. The lookup map this
    // replaced was built from `members?limit=100`, so anyone outside the
    // first 100 — every recently created member once the base passes
    // 100 — showed as "Unknown".
    accessorFn: (checkin) => checkin.member?.fullName ?? "",
    header: "Member",
    cell: ({ row }) => {
      const value = row.getValue<string>("member")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">Unknown</span>
    },
  },
  {
    id: "location",
    accessorFn: (checkin) => locationNames[checkin.locationId] ?? "",
    header: "Location",
    cell: ({ row }) => {
      const value = row.getValue<string>("location")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "checkedInAt",
    header: "Checked in",
    cell: ({ row }) => <span>{formatDateTime(row.getValue<string>("checkedInAt"))}</span>,
  },
  {
    accessorKey: "checkedOutAt",
    header: "Checked out",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("checkedOutAt")
      return value ? (
        <span>{formatDateTime(value)}</span>
      ) : (
        <Badge variant="secondary" className="border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          On site
        </Badge>
      )
    },
  },
  {
    id: "duration",
    accessorFn: duration,
    header: "Duration",
    cell: ({ row }) => <span className="tabular-nums">{row.getValue<string>("duration")}</span>,
  },
  {
    accessorKey: "entitlementUsed",
    header: "Entitlement",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal capitalize">
        {formatEnumLabel(row.getValue<string>("entitlementUsed"))}
      </Badge>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => <span className="uppercase text-xs">{row.getValue<string>("method")}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const checkin = row.original
      // Only an open interval can be closed.
      if (checkin.checkedOutAt) return <span className="text-muted-foreground">-</span>
      return (
        <CheckoutButton
          checkinId={checkin.id}
          memberName={checkin.member?.fullName || "Member"}
        />
      )
    },
  },
  ]
  return columns.filter((column) => !(hideMember && column.id === "member"))
}
