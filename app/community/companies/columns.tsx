"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CompanyDto, CompanyStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { formatDate } from "@/lib/format"
import { COMPANY_STATUS_CLASSES, COMPANY_STATUS_LABELS } from "./company-status"
import { CompanyRowActions } from "./company-row-actions"

interface ColumnsProps {
  onEdit: (company: CompanyDto) => void
}

function formatWebsite(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<CompanyDto>[] => [
  {
    id: "name",
    accessorKey: "name",
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<CompanyStatus>("status")
      return (
        <Badge variant="secondary" className={`${COMPANY_STATUS_CLASSES[value] ?? ""} border-0`}>
          {COMPANY_STATUS_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
  {
    accessorKey: "taxId",
    header: "Tax ID",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("taxId")
      return <span>{value || "-"}</span>
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
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("website")
      if (!value) return <span>-</span>

      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {formatWebsite(value)}
        </a>
      )
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue<string[] | undefined>("tags") ?? []
      if (tags.length === 0) return <span>-</span>

      return (
        <div className="flex flex-wrap items-center gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="border-0 capitalize">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline">+{tags.length - 2}</Badge>
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
    cell: ({ row }) => <CompanyRowActions company={row.original} onEdit={onEdit} />,
  },
]
