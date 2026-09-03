"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Archive, Edit } from "lucide-react"
import type { DiscountDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import { DISCOUNT_KIND_LABELS, formatDiscountValue, isInWindow } from "./discount-meta"

interface ColumnsProps {
  onEdit: (discount: DiscountDto) => void
  onArchive: (discount: DiscountDto) => void
  planNames?: Record<string, string>
  rateNames?: Record<string, string>
}

export const createColumns = ({ onEdit, onArchive, planNames = {}, rateNames = {} }: ColumnsProps): ColumnDef<DiscountDto>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.code}</code>
          {row.original.isPublic && (
            <Badge className="border-0 bg-sky-100 text-sky-800">Public</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "kind",
    header: "Kind",
    cell: ({ row }) => <Badge variant="secondary" className="border-0">{DISCOUNT_KIND_LABELS[row.original.kind]}</Badge>,
  },
  {
    id: "value",
    header: "Value",
    cell: ({ row }) => <span className="tabular-nums">{formatDiscountValue(row.original)}</span>,
  },
  {
    id: "appliesTo",
    header: "Applies to",
    cell: ({ row }) => {
      const d = row.original
      if (d.appliesToAll) {
        const label = d.kind === "plan" ? "All plans" : "All rates"
        return <Badge variant="outline">{label}</Badge>
      }
      const names =
        d.kind === "plan" ? d.planIds.map((id) => planNames[id] ?? "…")
        : d.resourceRateIds.map((id) => rateNames[id] ?? "…")
      return (
        <div className="flex max-w-[360px] flex-wrap gap-1">
          {names.map((n, i) => <Badge key={`${n}-${i}`} variant="outline">{n}</Badge>)}
        </div>
      )
    },
  },
  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const d = row.original
      if (!d.validFrom && !d.validUntil) return <span className="text-muted-foreground">—</span>
      const range = `${d.validFrom ? formatDate(d.validFrom) : "…"} → ${d.validUntil ? formatDate(d.validUntil) : "…"}`
      return (
        <div className="flex items-center gap-2 text-sm">
          <span>{range}</span>
          {!isInWindow(d) && <Badge variant="outline" className="border-0 bg-orange-100 text-orange-800">Outside window</Badge>}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "active"
        ? <Badge className="border-0 bg-emerald-100 text-emerald-800">Active</Badge>
        : <Badge variant="outline">Archived</Badge>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)} disabled={row.original.status === "archived"}>
          <Edit className="h-4 w-4" /><span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onArchive(row.original)} disabled={row.original.status === "archived"}>
          <Archive className="h-4 w-4" /><span className="sr-only">Archive</span>
        </Button>
      </div>
    ),
  },
]
