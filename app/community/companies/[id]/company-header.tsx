"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CopyId } from "@/components/details-dialog-parts"
import { Globe, Mail, Pencil, Phone } from "lucide-react"
import type { AddressDto, CompanyDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import { COMPANY_STATUS_CLASSES, COMPANY_STATUS_LABELS } from "../company-status"
import { CompanyFormDialog } from "../company-form-dialog"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatAddress(address?: AddressDto | null): string | null {
  if (!address) return null
  if (address.formattedAddress) return address.formattedAddress
  const parts = [
    address.street,
    [address.zip, address.city].filter(Boolean).join(" "),
    address.state,
    address.country,
  ].filter((part) => Boolean(part && part.trim()))
  return parts.length > 0 ? parts.join(", ") : null
}

/**
 * Who the company is, in a band above the tabs — the same shape as the
 * member header: a title row and a facts strip.
 */
export function CompanyHeader({ company }: Readonly<{ company: CompanyDto }>) {
  const [editOpen, setEditOpen] = useState(false)
  const address = formatAddress(company.billingAddress)

  return (
    <header className="mb-6 space-y-4 px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarFallback className="rounded-lg text-xl">{initials(company.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold leading-tight">{company.name}</h1>
              <Badge variant="secondary" className={`${COMPANY_STATUS_CLASSES[company.status] ?? ""} border-0`}>
                {COMPANY_STATUS_LABELS[company.status] ?? company.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {company.startDate ? `Customer since ${formatDate(company.startDate)}` : "No start date"}
              {company.taxId && (
                <>
                  <span className="mx-2">·</span>
                  Tax ID {company.taxId}
                </>
              )}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit
        </Button>
      </div>

      <dl className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contact
          </dt>
          <dd className="space-y-1">
            {company.email ? (
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{company.email}</span>
              </a>
            ) : (
              <p className="text-muted-foreground">No email</p>
            )}
            {company.phone ? (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {company.phone}
              </p>
            ) : (
              <p className="text-muted-foreground">No phone</p>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{company.website}</span>
              </a>
            )}
          </dd>
        </div>

        <div className="space-y-1.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Billing
          </dt>
          <dd className="space-y-1">
            <p>{company.billingName || company.name}</p>
            {company.registrationNumber && (
              <p className="text-muted-foreground">Reg. {company.registrationNumber}</p>
            )}
            {address ? (
              <p className="text-muted-foreground">{address}</p>
            ) : (
              <p className="text-muted-foreground">No billing address</p>
            )}
          </dd>
        </div>

        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tags & description
          </dt>
          <dd className="space-y-1.5">
            {company.tags?.length ? (
              <div className="flex flex-wrap gap-1">
                {company.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tags</p>
            )}
            {company.description && (
              <p className="line-clamp-3 whitespace-pre-wrap" title={company.description}>
                {company.description}
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span>Updated {formatDate(company.updatedAt)}</span>
              <CopyId id={company.id} label="Company" />
            </p>
          </dd>
        </div>
      </dl>

      {editOpen && (
        <CompanyFormDialog isOpen onClose={() => setEditOpen(false)} editingCompany={company} />
      )}
    </header>
  )
}
