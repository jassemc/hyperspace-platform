"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
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
import { Armchair, Ban, Building2, Pause, Pencil, Play, RotateCw, User } from "lucide-react"
import { getListMembershipPauses } from "@/lib/service"
import type { MembershipDto, MembershipPauseDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel, formatPriceHt, formatVatRate } from "@/lib/format"
import { formatDiscountValue } from "@/app/billing/discounts/discount-meta"
import { billingCycleLabel, membershipSnapshot } from "./membership-snapshot"
import { membershipValue, valueBreakdown } from "./membership-value"
import { MEMBERSHIP_STATUS_CLASSES, MEMBERSHIP_STATUS_LABELS } from "./membership-status"
import { CancelMembershipAlert } from "./cancel-membership-alert"
import { PauseMembershipDialog } from "./pause-membership-dialog"
import { RenewMembershipAlert } from "./renew-membership-alert"
import { ResumeMembershipAlert } from "./resume-membership-alert"
import type { MembershipActions } from "./use-membership-mutations"
import { assignBlocker, useMembershipMutations } from "./use-membership-mutations"
import { AssignmentsSection } from "@/components/assignments/assignments-section"

/**
 * Everything a membership is made of, read-only. The row already names its
 * customer and plan off the summaries carried on the dto, so only pauses
 * are fetched per open — a table of fifty rows must not fire fifty requests
 * for dialogs nobody opened.
 */
export function MembershipDetailsDialog({
  membership,
  open,
  onOpenChange,
  onEdit,
  busy = false,
  actions,
  companyId,
}: Readonly<{
  membership: MembershipDto
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Renders the footer's Edit button. */
  onEdit: () => void
  /** Another drawer is already loading; the footer must not start a second. */
  busy?: boolean
  /** Override for the four lifecycle actions — see useMembershipMutations. */
  actions?: MembershipActions
  /** Revalidates a company page instead of the memberships list. */
  companyId?: string
}>) {
  const [pauses, setPauses] = useState<MembershipPauseDto[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setPauses(null)
    setLoading(true)

    getListMembershipPauses(membership.id)
      .then((list) => {
        if (!cancelled) setPauses(list as MembershipPauseDto[])
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, membership.id])

  const {
    pending,
    canRenew,
    renewHint,
    canPause,
    pauseHint,
    canResume,
    resumeHint,
    canCancel,
    cancelHint,
    renew,
    pause,
    resume,
    cancel,
  } = useMembershipMutations(membership, actions, companyId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const assignHint = assignBlocker(membership)

  const label = membership.name || "This membership"
  const snapshot = membershipSnapshot(membership)
  const cycle = billingCycleLabel(snapshot.plan) ?? "One-off"
  const planName = membership.plan?.name || snapshot.plan?.name || "Plan not in snapshot"
  // Shared with the table's Price column, so the two cannot disagree.
  const value = membershipValue(membership)
  const breakdown = valueBreakdown(value)
  const discounted = value.discount !== null && value.discountHt !== 0
  const isPaused = membership.status === "paused"
  const isCompany = Boolean(membership.companyId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DetailsContent>
        <DetailsHeader
          visual={<Thumb name={label} icon={isCompany ? Building2 : User} />}
          title={label}
          badges={
            <>
              <StatusBadge className={MEMBERSHIP_STATUS_CLASSES[membership.status]}>
                {MEMBERSHIP_STATUS_LABELS[membership.status]}
              </StatusBadge>
              {membership.cancelledAt && (
                <Badge variant="outline">Cancelled {formatDate(membership.cancelledAt)}</Badge>
              )}
            </>
          }
          description={
            <>
              {/* A membership is usually named after its plan; say it once. */}
              {planName !== label && (
                <>
                  <span className="font-medium text-foreground">{planName}</span>
                  <Sep />
                </>
              )}
              <span>{cycle}</span>
              <Sep />
              <span>{isCompany ? "Company" : "Member"}</span>
            </>
          }
        />

        <DetailsBody>
          {/* The figure this membership bills on: plan and extras after the
              discount, with the list price it came from struck beside it so
              the reduction is visible at a glance. */}
          <Hero
            eyebrow={snapshot.plan?.cycleMonths ? "Price per cycle" : "Price"}
            hint={
              <>
                {cycle} · VAT {formatVatRate(snapshot.plan?.vatRate)}
                {breakdown ? ` · ${breakdown}` : ""}
              </>
            }
            aside={
              <>
                <p>Billed to the {membership.billTo}</p>
                {membership.discount?.code && (
                  <p className="flex items-center justify-end gap-1">
                    <span>Discount</span>
                    <Code>{membership.discount.code}</Code>
                    <span>{formatDiscountValue(membership.discount)}</span>
                  </p>
                )}
              </>
            }
          >
            <HeroValue className="items-baseline">
              {value.planListHt === null ? "-" : formatPriceHt(value.totalHt)}
              {discounted && (
                <s className="text-sm font-normal text-muted-foreground">
                  {formatPriceHt(value.totalHt - value.discountHt)}
                </s>
              )}
            </HeroValue>
          </Hero>

          <Section title="Customer">
            {membership.company ? (
              <Party kind="company" id={membership.company.id} name={membership.company.name} />
            ) : membership.member ? (
              <Party
                kind="member"
                id={membership.member.id}
                name={membership.member.fullName}
                email={membership.member.email}
              />
            ) : (
              <Empty>No customer attached.</Empty>
            )}
          </Section>

          <Section title="Term">
            <Terms>
              <Term label="Starts" value={formatDate(membership.startsAt)} />
              <Term
                label="Ends"
                value={membership.endsAt ? formatDate(membership.endsAt) : "open-ended"}
              />
              {membership.cancelledAt && (
                <Term label="Cancelled" value={formatDate(membership.cancelledAt)} />
              )}
            </Terms>
          </Section>

          <AssignmentsSection
            anchor={{ kind: "membership", membership }}
            open={open}
            assignBlocker={assignHint}
            createOpen={assignOpen}
            onCreateOpenChange={setAssignOpen}
          />

          <Section title="Extras">
            <ExtrasTable
              extras={snapshot.extras.map((extra) => ({ ...extra, id: extra.extraId }))}
              emptyText="No extras were taken with this membership."
            />
          </Section>

          {/* The contract this membership actually runs on. The catalog plan
              may since have been repriced or archived; none of that reaches
              a membership already sold, so these are the figures that count.
              The snapshot keeps the plan and extras at list price and the
              API writes the discount as its own negative lines each cycle;
              the rows replay that so the total never looks as if the
              discount were skipped. */}
          <Section
            title="Pricing"
            aside={
              snapshot.snapshotAt ? (
                <span className="text-xs text-muted-foreground">
                  Snapshot {formatDate(snapshot.snapshotAt)}
                </span>
              ) : undefined
            }
          >
            <Terms>
              <Term label="Plan (HT)" value={formatPriceHt(value.planListHt)} />
              {value.discount && (
                <>
                  <Term
                    label={`Discount ${value.discount.code} (${formatDiscountValue(value.discount)})`}
                    value={formatPriceHt(value.planDiscountHt)}
                  />
                  <Term label="Plan after discount (HT)" value={formatPriceHt(value.planHt)} />
                </>
              )}
              {value.extras.length > 0 && (
                <Term
                  label="Extras (HT)"
                  value={formatPriceHt(value.extrasHt + value.extrasDiscountHt)}
                  hint={
                    value.extrasDiscountHt !== 0 && (
                      <>
                        {formatPriceHt(value.extrasHt)} − {formatPriceHt(-value.extrasDiscountHt)}{" "}
                        {value.discount?.code}
                      </>
                    )
                  }
                />
              )}
              <Term label="VAT" value={formatVatRate(snapshot.plan?.vatRate)} />
              <Term
                total
                label={snapshot.plan?.cycleMonths ? "Total per cycle (HT)" : "Total (HT)"}
                value={formatPriceHt(value.totalHt)}
              />
            </Terms>
          </Section>

          <Section
            title="Plan terms"
            aside={
              membership.plan?.name ? (
                <Link href="/space/plan" className="text-xs text-primary hover:underline">
                  Catalog: {membership.plan.name}
                </Link>
              ) : undefined
            }
          >
            <Terms>
              <Term label="Billing" value={cycle} />
              {snapshot.plan?.kind && <Term label="Kind" value={formatEnumLabel(snapshot.plan.kind)} />}
              <Term label="Deposit" value={formatPriceHt(snapshot.plan?.deposit)} />
              <Term label="Setup fee" value={formatPriceHt(snapshot.plan?.setupFee)} />
              <Term
                label="Cancellation notice"
                value={
                  snapshot.plan?.cancellationDays ? `${snapshot.plan.cancellationDays} days` : "None"
                }
              />
            </Terms>
          </Section>

          <Section title="Included with this plan">
            <BenefitList benefits={snapshot.benefits} emptyText="This plan grants no benefits." />
          </Section>

          {loading ? (
            <Section title="Pauses">
              <Skeleton className="h-10 w-full" />
            </Section>
          ) : (
            pauses &&
            pauses.length > 0 && (
              <Section title="Pauses">
                <Terms>
                  {pauses.map((p) => (
                    <Term
                      key={p.id}
                      label={
                        <span className="text-foreground">
                          {formatDate(p.startsAt)} → {p.endsAt ? formatDate(p.endsAt) : "open"}
                        </span>
                      }
                      value={p.reason ? <span className="text-muted-foreground">{p.reason}</span> : ""}
                    />
                  ))}
                </Terms>
              </Section>
            )
          )}

          {membership.notes && (
            <Section title="Notes">
              <Notes>{membership.notes}</Notes>
            </Section>
          )}

          <MetaLine id={membership.id} label="Membership">
            <span>Created {formatDate(membership.createdAt)}</span>
            <span>Updated {formatDate(membership.updatedAt)}</span>
          </MetaLine>
        </DetailsBody>

        <DetailsFooter>
          <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={assignHint !== null}
            title={assignHint ?? "Allocate a resource for a period"}
            onClick={() => setAssignOpen(true)}
          >
            <Armchair className="mr-1.5 h-4 w-4" />
            Assign
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canRenew}
            title={renewHint ?? "Append another billing cycle"}
            onClick={() => setRenewOpen(true)}
          >
            <RotateCw className="mr-1.5 h-4 w-4" />
            Renew
          </Button>
          {isPaused ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!canResume}
              title={resumeHint ?? "Start billing again"}
              onClick={() => setResumeOpen(true)}
            >
              <Play className="mr-1.5 h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={!canPause}
              title={pauseHint ?? "Stop billing for a while"}
              onClick={() => setPauseOpen(true)}
            >
              <Pause className="mr-1.5 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            disabled={!canCancel}
            title={cancelHint ?? "Stop this membership renewing"}
            onClick={() => setCancelOpen(true)}
          >
            <Ban className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
        </DetailsFooter>

        <CancelMembershipAlert
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          label={label}
          pending={pending === "cancel"}
          onConfirm={async () => {
            if (await cancel()) setCancelOpen(false)
          }}
        />

        <RenewMembershipAlert
          open={renewOpen}
          onOpenChange={setRenewOpen}
          label={label}
          pending={pending === "renew"}
          onConfirm={async () => {
            if (await renew()) setRenewOpen(false)
          }}
        />

        {/* Mounted only while open so its fields reset by unmounting rather
            than needing an effect to clear them for next time. */}
        {pauseOpen && (
          <PauseMembershipDialog
            open={pauseOpen}
            onOpenChange={setPauseOpen}
            pending={pending === "pause"}
            onConfirm={async (fields) => {
              if (await pause(fields)) setPauseOpen(false)
            }}
          />
        )}

        {resumeOpen && (
          <ResumeMembershipAlert
            open={resumeOpen}
            onOpenChange={setResumeOpen}
            label={label}
            pending={pending === "resume"}
            onConfirm={async (fields) => {
              if (await resume(fields)) setResumeOpen(false)
            }}
          />
        )}
      </DetailsContent>
    </Dialog>
  )
}
