"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyId } from "@/components/details-dialog-parts";
import { Building2, Mail, Pencil, Phone, UserCog } from "lucide-react";
import type { MemberDto } from "@/lib/service/HsService";
import { formatDate, formatEnumLabel } from "@/lib/format";
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "../member-status";
import { MemberFormDialog } from "../member-form-dialog";
import { StatusDialog } from "../status-dialog";
import { useMemberMutations } from "../use-member-mutations";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Who the member is, in a band above the tabs: the title row (name, status,
 * actions) and a facts strip. Edit and Set status reuse the members-table
 * dialogs; the server actions behind them revalidate this route.
 */
export function MemberHeader({ member }: Readonly<{ member: MemberDto }>) {
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const { pending, setStatus } = useMemberMutations(member);

  return (
    <header className="mb-6 space-y-4 px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">
              {initials(member.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold leading-tight">
                {member.fullName}
              </h1>
              <Badge
                variant="secondary"
                className={`${MEMBER_STATUS_CLASSES[member.status]} border-0`}
              >
                {MEMBER_STATUS_LABELS[member.status]}
              </Badge>
              {member.statusOverride && <Badge variant="outline">Pinned</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {[
                formatEnumLabel(member.kindHint),
                member.segment && formatEnumLabel(member.segment),
              ]
                .filter(Boolean)
                .join(" · ")}
              <span className="mx-2">·</span>
              Member since {formatDate(member.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Facts strip: one column per topic, so the eye finds the phone or
          the employer without reading a list. */}
      <dl className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contact
          </dt>
          <dd className="space-y-1">
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
            {member.phone ? (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {member.phone}
              </p>
            ) : (
              <p className="text-muted-foreground">No phone</p>
            )}
          </dd>
        </div>

        <div className="space-y-1.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Employer
          </dt>
          <dd className="space-y-1">
            {!member.companyId ? (
              <p className="text-muted-foreground">Solo — no employer</p>
            ) : member.company ? (
              <>
                <Link
                  href={`/community/companies/${member.company.id}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {member.company.name}
                </Link>
                {(member.isBillingPerson || member.isContactPerson) && (
                  <div className="flex flex-wrap gap-1">
                    {member.isBillingPerson && (
                      <Badge variant="outline">Billing person</Badge>
                    )}
                    {member.isContactPerson && (
                      <Badge variant="outline">Contact person</Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Company memberships & invoices live on the company page.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Unknown company</p>
            )}
          </dd>
        </div>

        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tags & notes
          </dt>
          <dd className="space-y-1.5">
            {member.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {member.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tags</p>
            )}
            {member.notes && (
              <p
                className="line-clamp-3 whitespace-pre-wrap text-sm"
                title={member.notes}
              >
                {member.notes}
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span>Updated {formatDate(member.updatedAt)}</span>
              <CopyId id={member.id} label="Member" />
            </p>
          </dd>
        </div>
      </dl>

      {editOpen && (
        <MemberFormDialog
          isOpen
          onClose={() => setEditOpen(false)}
          editingMember={member}
        />
      )}
      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        member={member}
        pending={pending === "status"}
        onApply={async (choice) => {
          if (await setStatus(choice)) setStatusOpen(false);
        }}
      />
    </header>
  );
}
