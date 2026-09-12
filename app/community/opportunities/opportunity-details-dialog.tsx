"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BenefitList,
  Code,
  DetailsBody,
  DetailsContent,
  DetailsFooter,
  DetailsHeader,
  Empty,
  ExtrasTable,
  Hero,
  HeroValue,
  MetaLine,
  Notes,
  Party,
  Section,
  Sep,
  StatusBadge,
  Term,
  Terms,
  Thumb,
} from "@/components/details-dialog-parts"
import { CalendarDays, MapPin, Package, Pencil, User, UserPlus } from "lucide-react"
import { getPlan } from "@/lib/service"
import type { OpportunityDto, PlanDto } from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import { formatCalendarDate, formatDate, formatPriceHt } from "@/lib/format"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_STAGE_CLASSES,
  OPPORTUNITY_STAGE_LABELS,
  opportunityValue,
  valueBreakdown,
} from "./opportunity-meta"

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
  const requestedCode = apiString(opportunity.requestedDiscountCode)
  const publicOffer = apiString(opportunity.publicOfferCode)
  const value = opportunityValue(opportunity)
  const breakdown = valueBreakdown(value)
  const source = apiString(opportunity.source)
  const closed = Boolean(opportunity.closedAt)
  const memberName = member?.fullName || "Unknown member"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DetailsContent>
        <DetailsHeader
          visual={<Thumb name={memberName} icon={User} />}
          title={memberName}
          badges={
            <StatusBadge className={OPPORTUNITY_STAGE_CLASSES[opportunity.stage]}>
              {OPPORTUNITY_STAGE_LABELS[opportunity.stage] ?? opportunity.stage}
            </StatusBadge>
          }
          description={
            <>
              <span className="font-medium text-foreground">
                {OPPORTUNITY_INTEREST_LABELS[opportunity.interest] ?? opportunity.interest}
              </span>
              {source && (
                <>
                  <Sep />
                  <span>{source}</span>
                </>
              )}
            </>
          }
        />

        <DetailsBody>
          {/* What the deal is worth — the figure the pipeline is measured in. */}
          <Hero
            eyebrow="Expected value"
            hint={breakdown ?? "Set by the requested plan and its extras."}
          >
            <HeroValue>
              {value.total === null ? "Not quoted yet" : formatPriceHt(value.total)}
            </HeroValue>
          </Hero>

          <Section title="Customer">
            {member ? (
              <Party kind="member" id={member.id} name={member.fullName} email={member.email} />
            ) : (
              <Empty>No member attached.</Empty>
            )}
          </Section>

          <Section title="Requested">
            {!requestedPlan && !requestedResource && !requestedDate ? (
              <Empty>Nothing requested yet — a plan is needed before this lead can be converted.</Empty>
            ) : (
              <Terms>
                {requestedDate && (
                  <Term icon={CalendarDays} label="Date" value={formatCalendarDate(requestedDate)} />
                )}
                <Term
                  icon={Package}
                  label="Plan"
                  value={
                    requestedPlan ? (
                      requestedPlan.name
                    ) : (
                      <span className="text-muted-foreground">No plan</span>
                    )
                  }
                  hint={
                    requestedPlan && (
                      <>
                        {formatPriceHt(requestedPlan.priceHt)}
                        {value.planFee !== null &&
                          value.planFee !== requestedPlan.priceHt &&
                          ` · quoted at ${formatPriceHt(value.planFee)}`}
                      </>
                    )
                  }
                />
                <Term
                  icon={MapPin}
                  label="Space"
                  value={
                    requestedResource?.name ?? (
                      <span className="text-muted-foreground">Space to assign</span>
                    )
                  }
                />
                {requestedCode && (
                  <Term label="Requested discount code" value={<Code>{requestedCode}</Code>} />
                )}
                {/* The offer the website priced the lead with (backend #52),
                    shown apart from the visitor's own code (#51) — the
                    convert drawer lets staff pick which one applies. */}
                {publicOffer && (
                  <Term label="Public offer applied" value={<Code>{publicOffer}</Code>} />
                )}
              </Terms>
            )}
          </Section>

          <Section title="Extras">
            <ExtrasTable extras={value.extras.map((extra) => ({ ...extra, id: extra.extraId }))} />
          </Section>

          {planId && (
            <Section title="Included with this plan">
              {planLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <BenefitList
                  benefits={plan?.benefits ?? []}
                  emptyText={
                    plan ? "This plan includes no benefits." : "Could not load the plan's benefits."
                  }
                />
              )}
            </Section>
          )}

          {notes && (
            <Section title="Notes">
              <Notes>{notes}</Notes>
            </Section>
          )}

          {/* No time zone: an opportunity has no location, so these are dates
              rather than instants — the same call the table makes. */}
          <MetaLine id={opportunity.id} label="Opportunity">
            <span>Created {formatDate(opportunity.createdAt)}</span>
            <span>Updated {formatDate(opportunity.updatedAt)}</span>
            <span>{closed ? `Closed ${formatDate(opportunity.closedAt)}` : "Open"}</span>
          </MetaLine>
        </DetailsBody>

        <DetailsFooter>
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
        </DetailsFooter>
      </DetailsContent>
    </Dialog>
  )
}
