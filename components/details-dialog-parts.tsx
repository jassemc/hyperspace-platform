"use client"

import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PlaceholderImage } from "@/components/placeholder-image"
import { Building2, Copy, Mail, User } from "lucide-react"
import { toast } from "sonner"
import { benefitLabel, type LabelledBenefit } from "@/lib/benefits"
import { formatPriceHt, formatVatRate, priceTtc } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * The parts every details dialog (booking, opportunity, membership,
 * resource) is built from, so the four read as one design: the same
 * shell, header, hero card, term rows, extras table and footer. A dialog
 * owns only what is specific to its record.
 *
 * Reading order is the same everywhere: hero (the figure the reader came
 * for), who it is for, what it is made of, what it costs, then notes and
 * the meta line.
 */

type IconComponent = ComponentType<{ className?: string }>

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

/** The dialog body: a fixed header and footer around one scrolling column. */
export function DetailsContent({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <DialogContent className={cn("flex max-h-[90vh] max-w-2xl flex-col overflow-hidden", className)}>
      {children}
    </DialogContent>
  )
}

/** Visual tile, title with its badges, a one-line description, extra lines. */
export function DetailsHeader({
  visual,
  title,
  badges,
  description,
  children,
}: Readonly<{
  visual?: ReactNode
  title: ReactNode
  badges?: ReactNode
  description: ReactNode
  children?: ReactNode
}>) {
  return (
    <DialogHeader>
      <div className="flex items-start gap-3 pr-6 text-left">
        {visual}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="leading-tight">{title}</DialogTitle>
            {badges}
          </div>
          <DialogDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {description}
          </DialogDescription>
          {children}
        </div>
      </div>
    </DialogHeader>
  )
}

/** The scrolling column between header and footer. */
export function DetailsBody({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">{children}</div>
}

/** Small icon buttons, right-aligned, wrapping on narrow screens. */
export function DetailsFooter({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 sm:justify-end">
      {children}
    </DialogFooter>
  )
}

/**
 * The 56px tile beside the title: a photo when the record has one, else
 * the domain's icon, else the initials placeholder. Pulses while a
 * per-open fetch is still bringing the photo.
 */
export function Thumb({
  src,
  name,
  icon: Icon,
  loading = false,
}: Readonly<{
  src?: string | null
  name: string
  icon?: IconComponent
  loading?: boolean
}>) {
  if (loading) return <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
      {src ? (
        // Served from the public bucket, so the host is not known at build time.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : Icon ? (
        <Icon className="h-6 w-6 text-muted-foreground" />
      ) : (
        <PlaceholderImage name={name} className="h-full w-full" />
      )}
    </div>
  )
}

/** The status pill beside the title; `className` carries the status colour. */
export function StatusBadge({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <Badge variant="secondary" className={cn(className, "border-0")}>
      {children}
    </Badge>
  )
}

/** The middle dot between facts on the description line. */
export function Sep() {
  return <span aria-hidden="true">·</span>
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The one figure the reader opened the dialog for — a booking's slot, a
 * lead's value, a membership's price — set large on a tinted card.
 */
export function Hero({
  eyebrow,
  hint,
  aside,
  children,
}: Readonly<{
  eyebrow?: ReactNode
  hint?: ReactNode
  /** Secondary facts, right-aligned and small. */
  aside?: ReactNode
  children: ReactNode
}>) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <div className={cn(eyebrow && "mt-1")}>{children}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {aside && (
        <div className="shrink-0 space-y-1 text-right text-xs text-muted-foreground">{aside}</div>
      )}
    </div>
  )
}

/** The hero's headline figure. */
export function HeroValue({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <p className={cn("flex flex-wrap items-center gap-2 text-2xl font-semibold tabular-nums", className)}>
      {children}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Sections and rows
// ---------------------------------------------------------------------------

export function Section({
  title,
  aside,
  children,
}: Readonly<{ title: string; aside?: ReactNode; children: ReactNode }>) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** A bordered list of label / value rows. */
export function Terms({ children }: Readonly<{ children: ReactNode }>) {
  return <dl className="rounded-lg border text-sm">{children}</dl>
}

/** One row of a `Terms` list; `total` sets it in bold on a tinted band. */
export function Term({
  icon: Icon,
  label,
  value,
  hint,
  total = false,
}: Readonly<{
  icon?: IconComponent
  label: ReactNode
  value: ReactNode
  /** A second, quieter line under the value. */
  hint?: ReactNode
  total?: boolean
}>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b px-3 py-2 first:rounded-t-lg last:rounded-b-lg last:border-b-0",
        total && "bg-muted/40 font-semibold"
      )}
    >
      <dt className={cn("flex items-center gap-2", total ? "text-foreground" : "text-muted-foreground")}>
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </dt>
      <dd className="text-right tabular-nums">
        {value}
        {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  )
}

/** A code the customer typed or the website applied, e.g. a discount. */
export function Code({ children }: Readonly<{ children: ReactNode }>) {
  return <code className="rounded bg-muted px-1 text-xs">{children}</code>
}

/** The Notes section's body: a tinted box that keeps the author's line breaks. */
export function Notes({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">{children}</p>
}

/** A quiet one-line empty state. */
export function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

// ---------------------------------------------------------------------------
// Who
// ---------------------------------------------------------------------------

export function EmailLink({ email }: Readonly<{ email: string }>) {
  return (
    <a
      href={`mailto:${email}`}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Mail className="h-3 w-3" />
      {email}
    </a>
  )
}

/**
 * The member or company a record belongs to: icon, name linked to their
 * page, and a mail link. The same line in every dialog, so staff learn one
 * way to jump from a record to its customer.
 */
export function Party({
  kind,
  id,
  name,
  email,
}: Readonly<{
  kind: "member" | "company"
  id?: string | null
  name: string
  email?: string | null
}>) {
  const Icon = kind === "company" ? Building2 : User
  const href = id ? `/community/${kind === "company" ? "companies" : "members"}/${id}` : null
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        {href ? (
          <Link href={href} className="text-primary hover:underline">
            {name}
          </Link>
        ) : (
          <p>{name}</p>
        )}
        {email && (
          <p className="mt-0.5">
            <EmailLink email={email} />
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// What it is made of
// ---------------------------------------------------------------------------

export interface ExtraLine {
  id: string
  name: string
  priceHt: number
  vatRate: number
  /** The API's own figure when it has one; otherwise derived from the rate. */
  totalTtc?: number
  deposit?: number | null
}

/**
 * The extras taken with a booking, a lead or a membership, priced the same
 * way in all three: HT, the VAT rate, and TTC, with a totals row.
 */
export function ExtrasTable({
  extras,
  emptyText = "No extras.",
}: Readonly<{ extras: ExtraLine[]; emptyText?: string }>) {
  if (extras.length === 0) return <Empty>{emptyText}</Empty>

  const rows = extras.map((extra) => ({
    ...extra,
    totalTtc: extra.totalTtc ?? priceTtc(extra.priceHt, extra.vatRate),
  }))
  const totalHt = rows.reduce((sum, row) => sum + row.priceHt, 0)
  const totalTtc = rows.reduce((sum, row) => sum + row.totalTtc, 0)

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Extra</th>
            <th className="px-3 py-2 text-right font-medium">Price HT</th>
            <th className="px-3 py-2 text-right font-medium">VAT</th>
            <th className="px-3 py-2 text-right font-medium">Total TTC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="px-3 py-2">
                {row.name}
                {row.deposit ? (
                  <span className="block text-xs text-muted-foreground">
                    Deposit {formatPriceHt(row.deposit)}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(row.priceHt)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatVatRate(row.vatRate)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(row.totalTtc)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t bg-muted/40 font-medium">
          <tr>
            <td className="px-3 py-2">Extras total</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(totalHt)}</td>
            <td />
            <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(totalTtc)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/** What a plan grants, one line per benefit. */
export function BenefitList({
  benefits,
  emptyText = "This plan includes no benefits.",
}: Readonly<{ benefits: readonly LabelledBenefit[]; emptyText?: string }>) {
  if (benefits.length === 0) return <Empty>{emptyText}</Empty>
  return (
    <ul className="space-y-1 rounded-lg border bg-muted/30 p-3">
      {benefits.map((benefit, index) => (
        // Snapshot benefits carry no id of their own, and neither list reorders.
        <li key={index} className="text-sm text-muted-foreground">
          {benefitLabel(benefit)}
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export function CopyId({ id, label }: Readonly<{ id: string; label?: string }>) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
      title={`Copy ${label ?? "ID"}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id)
          toast.success(`${label ?? "ID"} copied`)
        } catch {
          toast.error("Could not copy")
        }
      }}
    >
      {id}
      <Copy className="h-3 w-3" />
    </button>
  )
}

/** The closing line: created / updated / any other date, then the id to copy. */
export function MetaLine({
  id,
  label,
  children,
}: Readonly<{ id: string; label: string; children: ReactNode }>) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {children}
      <CopyId id={id} label={label} />
    </p>
  )
}
