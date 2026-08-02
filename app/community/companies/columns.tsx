"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CompanyDto } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Eye } from "lucide-react"
import Link from "next/link"

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
    cell: ({ row }) => {
      const value = row.getValue<string>("createdAt")
      const date = value ? new Date(value) : null
      return <span>{date ? date.toLocaleDateString() : "-"}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const company = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 border-slate-200 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 dark:border-slate-700"
          >
            <Link href={`/community/companies/${company.id}`} aria-label={`Open ${company.name}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(company)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
