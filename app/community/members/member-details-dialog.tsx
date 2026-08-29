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
import { Mail, Pencil, UserCog } from "lucide-react"
import { getListMemberships } from "@/lib/service"
import type { MemberDto, MembershipDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "./member-status"
import {
  MEMBERSHIP_STATUS_CLASSES,
  MEMBERSHIP_STATUS_LABELS,
} from "../memberships/membership-status"
import { StatusDialog } from "./status-dialog"
import { useMemberMutations } from "./use-member-mutations"

/** Active first, then the rest of the lifecycle in order. */
const MEMBERSHIP_STATUS_RANK: Record<MembershipDto["status"], number> = {
  active: 0,
  pending: 1,
  paused: 2,
  ended: 3,
}

/**
 * Everything a member is made of, read-only. The row already names them, so
 * the identity — including their employer, off the summary — renders without
 * a request; only memberships are fetched per open, since a table of fifty
 * rows must not fire a hundred requests for dialogs nobody opened.
 */
export function MemberDetailsDialog({
  member,
  open,
  onOpenChange,
  onEdit,
  busy = false,
}: Readonly<{
  member: MemberDto
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Renders the footer's Edit button. */
  onEdit: () => void
  /** Another drawer is already loading; the footer must not start a second. */
  busy?: boolean
}>) {
  const [memberships, setMemberships] = useState<MembershipDto[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setMemberships(null)
    setLoading(true)
    getListMemberships({ limit: 20, offset: 0, sort: "DESC", memberId: member.id })
      .then((page) => {
        if (!cancelled) setMemberships(pageResult<MembershipDto>(page).results)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, member.id])

  // Shared with the row menu so the status action cannot drift between the
  // two entry points. Applying a status here refreshes the table, but that
  // refreshed data does not flow into an already-open dialog — `member`
  // stays the stale prop it was opened with, so the header badge only
  // catches up the next time this dialog is opened.
  const { pending, setStatus } = useMemberMutations(member)
  const [statusOpen, setStatusOpen] = useState(false)

  const activeCount = memberships?.filter((m) => m.status === "active").length ?? 0
  const sortedMemberships = memberships
    ? [...memberships].sort(
        (a, b) => MEMBERSHIP_STATUS_RANK[a.status] - MEMBERSHIP_STATUS_RANK[b.status]
      )
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6 text-left">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="leading-tight">{member.fullName}</DialogTitle>
                <Badge variant="secondary" className={`${MEMBER_STATUS_CLASSES[member.status]} border-0`}>
                  {MEMBER_STATUS_LABELS[member.status]}
                </Badge>
                {member.statusOverride && <Badge variant="outline">Pinned</Badge>}
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {[formatEnumLabel(member.kindHint), member.segment && formatEnumLabel(member.segment)]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {member.email}
                </a>
              )}
              {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* The figure the member's standing is measured in. */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Active memberships</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums">{activeCount}</p>
            )}
          </div>

          <Section title="Employer">
            {!member.companyId ? (
              <span className="text-muted-foreground">Solo — no employer</span>
            ) : member.company ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/community/companies/${member.company.id}`} className="text-primary hover:underline">
                  {member.company.name}
                </Link>
                {member.isBillingPerson && <Badge variant="outline">Billing person</Badge>}
                {member.isContactPerson && <Badge variant="outline">Contact person</Badge>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unknown company</p>
            )}
          </Section>

          <Section title="Memberships">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : sortedMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memberships yet</p>
            ) : (
              <div className="rounded-lg border text-sm">
                {sortedMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-start justify-between gap-3 border-b px-3 py-2 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p>{membership.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(membership.startsAt)} →{" "}
                        {membership.endsAt ? formatDate(membership.endsAt) : "open-ended"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${MEMBERSHIP_STATUS_CLASSES[membership.status]} border-0`}
                    >
                      {MEMBERSHIP_STATUS_LABELS[membership.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {member.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1">
                {member.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {member.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-wrap text-sm">{member.notes}</p>
            </Section>
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDate(member.createdAt)}</span>
            <span>Updated {formatDate(member.updatedAt)}</span>
            <CopyId id={member.id} label="Member" />
          </p>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)} disabled={pending !== null}>
            <UserCog className="mr-1.5 h-4 w-4" />
            Set status
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </DialogFooter>

        <StatusDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          member={member}
          pending={pending === "status"}
          onApply={async (choice) => {
            if (await setStatus(choice)) setStatusOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
