"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CopyId, Section } from "@/components/details-dialog-parts"
import { Building2, Mail, Pencil, Phone, UserCog } from "lucide-react"
import type { MemberDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "../member-status"
import { MemberFormDialog } from "../member-form-dialog"
import { StatusDialog } from "../status-dialog"
import { useMemberMutations } from "../use-member-mutations"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Who the member is, always on screen. Edit and Set status live here so the
 * page never needs a row menu; both reuse the members-table dialogs, and the
 * server actions behind them revalidate this route so the card catches up.
 */
export function IdentityCard({ member }: Readonly<{ member: MemberDto }>) {
  const [editOpen, setEditOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const { pending, setStatus } = useMemberMutations(member)

  return (
    <Card className="lg:sticky lg:top-6">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusOpen(true)}
            disabled={pending !== null}
          >
            <UserCog className="mr-1.5 h-4 w-4" />
            Set status
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg">{initials(member.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{member.fullName}</h1>
              <Badge variant="secondary" className={`${MEMBER_STATUS_CLASSES[member.status]} border-0`}>
                {MEMBER_STATUS_LABELS[member.status]}
              </Badge>
              {member.statusOverride && <Badge variant="outline">Pinned</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {[formatEnumLabel(member.kindHint), member.segment && formatEnumLabel(member.segment)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <Section title="Contact">
          <div className="space-y-1 text-sm">
            {member.email ? (
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{member.email}</span>
              </a>
            ) : (
              <p className="text-muted-foreground">No email</p>
            )}
            {member.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {member.phone}
              </p>
            )}
          </div>
        </Section>

        <Section title="Employer">
          {!member.companyId ? (
            <p className="text-sm text-muted-foreground">Solo — no employer</p>
          ) : member.company ? (
            <div className="space-y-1.5 text-sm">
              <Link
                href={`/community/companies/${member.company.id}`}
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {member.company.name}
              </Link>
              {(member.isBillingPerson || member.isContactPerson) && (
                <div className="flex flex-wrap gap-1">
                  {member.isBillingPerson && <Badge variant="outline">Billing person</Badge>}
                  {member.isContactPerson && <Badge variant="outline">Contact person</Badge>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Company memberships & invoices live on {member.company.name}.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unknown company</p>
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
      </CardContent>

      {editOpen && (
        <MemberFormDialog isOpen onClose={() => setEditOpen(false)} editingMember={member} />
      )}
      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        member={member}
        pending={pending === "status"}
        onApply={async (choice) => {
          if (await setStatus(choice)) setStatusOpen(false)
        }}
      />
    </Card>
  )
}
