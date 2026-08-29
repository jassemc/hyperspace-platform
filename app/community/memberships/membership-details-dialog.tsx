"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { CopyId, Section } from "@/components/details-dialog-parts"
import { Ban, Mail, Pause, Pencil, Play, RotateCw } from "lucide-react"
import { getCompany, getListMembershipPauses, getMember, getPlan } from "@/lib/service"
import type {
  CompanyDto,
  MemberDto,
  MembershipDto,
  MembershipPauseDto,
  PlanDto,
} from "@/lib/service/HsService"
import { formatDate, formatEnumLabel, formatPriceHt, formatVatRate } from "@/lib/format"
import { benefitLabel } from "@/lib/benefits"
import { formatDiscountValue } from "@/app/billing/discounts/discount-meta"
import { billingCycleLabel, membershipSnapshot } from "./membership-snapshot"
import { MEMBERSHIP_STATUS_CLASSES, MEMBERSHIP_STATUS_LABELS } from "./membership-status"
import { CancelMembershipAlert } from "./cancel-membership-alert"
import { PauseMembershipDialog } from "./pause-membership-dialog"
import { RenewMembershipAlert } from "./renew-membership-alert"
import { ResumeMembershipAlert } from "./resume-membership-alert"
import type { MembershipActions } from "./use-membership-mutations"
import { useMembershipMutations } from "./use-membership-mutations"

/** A row of the frozen terms table — same rhythm as the edit drawer's. */
function Term({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b px-3 py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  )
}

/**
 * Everything a membership is made of, read-only. The row already names its
 * customer and plan, but the customer record, the live catalog plan (to
 * name it — the terms it actually runs on live in the snapshot below) and
 * any pauses are fetched per open, so a table of fifty rows never fires
 * fifty requests for dialogs nobody opened.
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
  const [member, setMember] = useState<MemberDto | null>(null)
  const [company, setCompany] = useState<CompanyDto | null>(null)
  const [livePlan, setLivePlan] = useState<PlanDto | null>(null)
  const [pauses, setPauses] = useState<MembershipPauseDto[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setMember(null)
    setCompany(null)
    setLivePlan(null)
    setPauses(null)
    setLoading(true)

    const customerLoad = membership.companyId
      ? getCompany(membership.companyId)
          .then((c) => {
            if (!cancelled) setCompany(c as CompanyDto)
          })
          .catch(() => undefined)
      : membership.memberId
        ? getMember(membership.memberId)
            .then((m) => {
              if (!cancelled) setMember(m as MemberDto)
            })
            .catch(() => undefined)
        : Promise.resolve()

    const planLoad = getPlan(membership.planId)
      .then((p) => {
        if (!cancelled) setLivePlan(p as PlanDto)
      })
      .catch(() => undefined)

    const pausesLoad = getListMembershipPauses(membership.id)
      .then((list) => {
        if (!cancelled) setPauses(list as MembershipPauseDto[])
      })
      .catch(() => undefined)

    Promise.all([customerLoad, planLoad, pausesLoad]).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, membership.id, membership.memberId, membership.companyId, membership.planId])

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

  const label = membership.name || "This membership"
  const snapshot = membershipSnapshot(membership)
  const cycle = billingCycleLabel(snapshot.plan) ?? "One-off"
  const isPaused = membership.status === "paused"
  const isCompany = Boolean(membership.companyId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6 text-left">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="leading-tight">{label}</DialogTitle>
                <Badge variant="secondary" className={`${MEMBERSHIP_STATUS_CLASSES[membership.status]} border-0`}>
                  {MEMBERSHIP_STATUS_LABELS[membership.status]}
                </Badge>
                {membership.cancelledAt && (
                  <Badge variant="outline">Cancelled {formatDate(membership.cancelledAt)}</Badge>
                )}
              </div>
              <DialogDescription>
                {isCompany ? "Company" : "Member"} · {snapshot.plan?.name ?? "Plan not in snapshot"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* The figure this membership bills on. */}
          <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan price</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatPriceHt(snapshot.plan?.priceHt)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {cycle} · VAT {formatVatRate(snapshot.plan?.vatRate)}
              </p>
            </div>
            <div className="space-y-1 text-right text-xs text-muted-foreground">
              <p>Billed to the {membership.billTo}</p>
              {membership.discount?.code && (
                <p className="flex items-center justify-end gap-1">
                  <span>Discount</span>
                  <code className="rounded bg-muted px-1 text-xs">{membership.discount.code}</code>
                  <span>{formatDiscountValue(membership.discount)}</span>
                </p>
              )}
            </div>
          </div>

          <Section title="Term">
            <div className="rounded-lg border text-sm">
              <Term label="Starts" value={formatDate(membership.startsAt)} />
              <Term
                label="Ends"
                value={membership.endsAt ? formatDate(membership.endsAt) : "open-ended"}
              />
              {membership.cancelledAt && (
                <Term label="Cancelled" value={formatDate(membership.cancelledAt)} />
              )}
            </div>
          </Section>

          <Section title="Customer">
            {loading ? (
              <Skeleton className="h-6 w-40" />
            ) : isCompany ? (
              company ? (
                <Link
                  href={`/community/companies/${company.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {company.name}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">Could not load</p>
              )
            ) : member ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>{member.fullName}</span>
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load</p>
            )}
          </Section>

          {/* The contract this membership actually runs on. The catalog plan
              may since have been repriced or archived; none of that reaches
              a membership already sold, so this is the figure that counts. */}
          <Section
            title="Plan snapshot"
            aside={
              loading ? (
                <Skeleton className="h-4 w-24" />
              ) : livePlan ? (
                <Link href="/space/plan" className="text-xs text-primary hover:underline">
                  Catalog: {livePlan.name}
                </Link>
              ) : undefined
            }
          >
            <div className="rounded-lg border text-sm">
              <Term label="Price (HT)" value={formatPriceHt(snapshot.plan?.priceHt)} />
              <Term label="VAT" value={formatVatRate(snapshot.plan?.vatRate)} />
              <Term label="Deposit" value={formatPriceHt(snapshot.plan?.deposit)} />
              <Term label="Setup fee" value={formatPriceHt(snapshot.plan?.setupFee)} />
              {snapshot.plan?.kind && <Term label="Kind" value={formatEnumLabel(snapshot.plan.kind)} />}
              <Term
                label="Cancellation days"
                value={
                  snapshot.plan?.cancellationDays ? `${snapshot.plan.cancellationDays} days` : "None"
                }
              />
              {snapshot.snapshotAt && <Term label="Taken" value={formatDate(snapshot.snapshotAt)} />}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Extras</p>
              {snapshot.extras.length === 0 ? (
                <p className="text-xs text-muted-foreground">No extras were taken with this membership.</p>
              ) : (
                <div className="rounded-lg border text-sm">
                  {snapshot.extras.map((extra) => (
                    <Term
                      key={extra.extraId}
                      label={extra.name}
                      value={
                        <>
                          {formatPriceHt(extra.priceHt)}
                          <span className="block text-xs text-muted-foreground">
                            VAT {formatVatRate(extra.vatRate)}
                            {extra.deposit ? ` · deposit ${formatPriceHt(extra.deposit)}` : ""}
                          </span>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Included benefits</p>
              {snapshot.benefits.length === 0 ? (
                <p className="text-xs text-muted-foreground">This plan grants no benefits.</p>
              ) : (
                <ul className="space-y-1 rounded-lg border bg-muted/30 p-3">
                  {snapshot.benefits.map((benefit, index) => (
                    // Snapshot benefits carry no id of their own, and the
                    // list is a frozen copy that never reorders.
                    <li key={index} className="text-sm text-muted-foreground">
                      {benefitLabel(benefit)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          {pauses && pauses.length > 0 && (
            <Section title="Pauses">
              <div className="rounded-lg border text-sm">
                {pauses.map((p) => (
                  <div key={p.id} className="border-b px-3 py-2 last:border-b-0">
                    <p>
                      {formatDate(p.startsAt)} → {p.endsAt ? formatDate(p.endsAt) : "open"}
                    </p>
                    {p.reason && <p className="text-xs text-muted-foreground">{p.reason}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {membership.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-wrap text-sm">{membership.notes}</p>
            </Section>
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDate(membership.createdAt)}</span>
            <span>Updated {formatDate(membership.updatedAt)}</span>
            <CopyId id={membership.id} label="Membership" />
          </p>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
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
        </DialogFooter>

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
      </DialogContent>
    </Dialog>
  )
}
