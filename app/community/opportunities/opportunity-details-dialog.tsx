"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Copy, Mail, MapPin, Package, Pencil, User, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { getPlan } from "@/lib/service"
import type { OpportunityDto, PlanDto } from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import {
  formatCalendarDate,
  formatDate,
  formatPriceHt,
  formatVatRate,
  priceTtc,
} from "@/lib/format"
import { benefitLabel } from "@/lib/benefits"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_STAGE_CLASSES,
  OPPORTUNITY_STAGE_LABELS,
  opportunityValue,
  valueBreakdown,
} from "./opportunity-meta"

function Section({
  title,
  aside,
  children,
}: Readonly<{ title: string; aside?: React.ReactNode; children: React.ReactNode }>) {
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

function CopyId({ id }: Readonly<{ id: string }>) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
      title="Copy opportunity ID"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id)
          toast.success("Opportunity ID copied")
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

/**
 * Everything a lead is made of, read-only. The row already names its member,
 * plan and space, so all of that renders without a request; only the plan's
 * benefits are missing, and those are fetched per open — a table of fifty
 * rows must not fire fifty requests for dialogs nobody opened.
 */
export function OpportunityDetailsDialog({
  opportunity,
  open,
  onOpenChange,
  onEdit,
  onConvert,
  busy = false,
}: Readonly<{
  opportunity: OpportunityDto
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Renders the footer's Edit button when provided. */
  onEdit?: () => void
  /** Renders the footer's Convert button when provided. */
  onConvert?: () => void
  /** Another drawer is already loading; the footer must not start a second. */
  busy?: boolean
}>) {
  const planId = apiString(opportunity.requestedPlanId)
  const [plan, setPlan] = useState<PlanDto | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    if (!open || !planId) return
    let cancelled = false
    setPlan(null)
    setPlanLoading(true)
    getPlan(planId)
      .then((loaded) => {
        if (!cancelled) setPlan(loaded as PlanDto)
      })
      // The benefits are a bonus; the rest of the dialog stands without them.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPlanLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, planId])

  const { member, requestedPlan, requestedResource, notes } = opportunity
  // The day the visitor asked for — a wish to confirm, not a booking.
  const requestedDate = apiString(opportunity.requestedDate)
  const value = opportunityValue(opportunity)
  const breakdown = valueBreakdown(value)
  const source = apiString(opportunity.source)
  const closed = Boolean(opportunity.closedAt)
  const benefits = plan?.benefits ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="leading-tight">
                  {member?.fullName || "Unknown member"}
                </DialogTitle>
                <Badge
                  variant="secondary"
                  className={`${OPPORTUNITY_STAGE_CLASSES[opportunity.stage] ?? ""} border-0`}
                >
                  {OPPORTUNITY_STAGE_LABELS[opportunity.stage] ?? opportunity.stage}
                </Badge>
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-medium text-foreground">
                  {OPPORTUNITY_INTEREST_LABELS[opportunity.interest] ?? opportunity.interest}
                </span>
                {source && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{source}</span>
                  </>
                )}
              </DialogDescription>
              {member?.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {member.email}
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* What the deal is worth — the figure the pipeline is measured in. */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Expected value</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {value.total === null ? "Not quoted yet" : formatPriceHt(value.total)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {breakdown ?? "Set by the requested plan and its add-ons."}
            </p>
          </div>

          <Section title="Requested">
            {!requestedPlan && !requestedResource && !requestedDate ? (
              <p className="text-sm text-muted-foreground">
                Nothing requested yet — a plan is needed before this lead can be converted.
              </p>
            ) : (
              <dl className="rounded-lg border text-sm">
                {requestedDate && (
                  <div className="flex items-start justify-between gap-3 px-3 py-2">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Date
                    </dt>
                    <dd className="text-right">{formatCalendarDate(requestedDate)}</dd>
                  </div>
                )}
                <div
                  className={`flex items-start justify-between gap-3 px-3 py-2 ${
                    requestedDate ? "border-t" : ""
                  }`}
                >
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Plan
                  </dt>
                  <dd className="text-right">
                    {requestedPlan ? (
                      <>
                        <span>{requestedPlan.name}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {formatPriceHt(requestedPlan.priceHt)}
                          {value.planFee !== null &&
                            value.planFee !== requestedPlan.priceHt &&
                            ` · quoted at ${formatPriceHt(value.planFee)}`}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No plan</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-t px-3 py-2">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Space
                  </dt>
                  <dd className="text-right">
                    {requestedResource?.name ?? (
                      <span className="text-muted-foreground">Space to assign</span>
                    )}
                  </dd>
                </div>
                {apiString(opportunity.requestedDiscountCode) && (
                  <div className="flex items-start justify-between gap-3 border-t px-3 py-2">
                    <dt className="text-muted-foreground">Requested discount code</dt>
                    <dd className="text-right">
                      <code className="rounded bg-muted px-1 text-xs">
                        {opportunity.requestedDiscountCode}
                      </code>
                    </dd>
                  </div>
                )}
                {/* The offer the website priced the lead with (backend #52),
                    shown apart from the visitor's own code (#51) — the
                    convert drawer lets staff pick which one applies. */}
                {apiString(opportunity.publicOfferCode) && (
                  <div className="flex items-start justify-between gap-3 border-t px-3 py-2">
                    <dt className="text-muted-foreground">Public offer applied</dt>
                    <dd className="text-right">
                      <code className="rounded bg-muted px-1 text-xs">
                        {opportunity.publicOfferCode}
                      </code>
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </Section>

          {planId && (
            <Section title="Included with this plan">
              {planLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : benefits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {plan ? "This plan includes no benefits." : "Could not load the plan's benefits."}
                </p>
              ) : (
                <ul className="space-y-1 rounded-lg border bg-muted/30 p-3">
                  {benefits.map((benefit) => (
                    <li key={benefit.id} className="text-sm text-muted-foreground">
                      {benefitLabel(benefit)}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          <Section title="Paid add-ons">
            {value.extras.length === 0 ? (
              <p className="text-sm text-muted-foreground">No add-ons.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Add-on</th>
                      <th className="px-3 py-2 text-right font-medium">Price HT</th>
                      <th className="px-3 py-2 text-right font-medium">VAT</th>
                      <th className="px-3 py-2 text-right font-medium">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {value.extras.map((extra) => (
                      <tr key={extra.extraId} className="border-t">
                        <td className="px-3 py-2">{extra.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatPriceHt(extra.priceHt)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatVatRate(extra.vatRate)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatPriceHt(priceTtc(extra.priceHt, extra.vatRate))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/40 font-medium">
                    <tr>
                      <td className="px-3 py-2">Add-ons total</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatPriceHt(value.extrasTotal)}
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Section>

          {notes && (
            <Section title="Notes">
              <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                {notes}
              </p>
            </Section>
          )}

          {/* No time zone: an opportunity has no location, so these are dates
              rather than instants — the same call the table makes. */}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDate(opportunity.createdAt)}</span>
            <span>Updated {formatDate(opportunity.updatedAt)}</span>
            <span>
              {closed ? `Closed ${formatDate(opportunity.closedAt)}` : "Open"}
            </span>
            <CopyId id={opportunity.id} />
          </p>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 sm:justify-end">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          )}
          {onConvert && (
            <Button size="sm" onClick={onConvert} disabled={busy || closed || !planId}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              Convert
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
