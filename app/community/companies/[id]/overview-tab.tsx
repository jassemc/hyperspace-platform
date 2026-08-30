import Link from "next/link"
import { StatCards } from "@/components/stat-cards"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, CreditCard, Receipt, Users } from "lucide-react"
import type { CompanyDetailsDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { primaryTimeZone } from "@/lib/locations"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "@/app/community/members/member-status"
import { memberPath } from "@/app/community/members/[id]/member-route"
import { CurrentMemberships } from "@/app/community/members/[id]/overview/current-memberships"
import { OpenBilling } from "@/app/community/members/[id]/overview/open-billing"
import { RecentActivity } from "@/app/community/members/[id]/overview/recent-activity"
import { Empty, Row, Rows, Section } from "@/app/community/members/[id]/overview/section"
import { companyPath } from "./company-route"

/** Available credit across every membership the company holds. */
function creditsAvailable(company: CompanyDetailsDto): number {
  return company.credits.balances
    .flatMap((block) => block.balances)
    .reduce((sum, balance) => sum + balance.available, 0)
}

/**
 * The company twin of the member overview: numbers on top, state on the
 * left (people, memberships, billing), what happened on the right.
 */
export async function OverviewTab({ company }: Readonly<{ company: CompanyDetailsDto }>) {
  const timeZone = await primaryTimeZone().catch(() => "UTC")
  const { members, memberships, bookings, invoices, charges } = company
  const keyPeople = members.items.filter((m) => m.isBillingPerson || m.isContactPerson)

  return (
    <div>
      <StatCards
        cards={[
          {
            label: "Members",
            value: members.active,
            unit: "active",
            icon: Users,
            footer: `${members.total} in total`,
          },
          {
            label: "Memberships",
            value: memberships.active,
            unit: "active",
            icon: CalendarClock,
            footer: `${memberships.total} across the company and its members`,
          },
          {
            label: "Credits",
            value: creditsAvailable(company),
            unit: "available",
            icon: CreditCard,
            footer: `${bookings.upcoming} upcoming booking${bookings.upcoming === 1 ? "" : "s"}`,
          },
          {
            label: "Outstanding",
            value: formatPriceHt(invoices.outstandingTtc),
            icon: Receipt,
            footer: `${invoices.open} open invoice${invoices.open === 1 ? "" : "s"} · ${
              charges.uninvoiced
            } uninvoiced charge${charges.uninvoiced === 1 ? "" : "s"}`,
          },
        ]}
      />

      <div className="grid gap-4 px-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Section
            title="Key people"
            viewAllHref={companyPath(company.id, "members")}
            aside={
              <span className="text-xs text-muted-foreground">
                {members.active} active · {members.total} total
              </span>
            }
          >
            {keyPeople.length === 0 ? (
              <Empty>No billing or contact person set</Empty>
            ) : (
              <Rows>
                {keyPeople.map((member) => (
                  <Row
                    key={member.id}
                    primary={
                      <Link href={memberPath(member.id)} className="font-medium hover:underline">
                        {member.fullName}
                      </Link>
                    }
                    secondary={[member.email, member.phone].filter(Boolean).join(" · ") || undefined}
                    aside={
                      <span className="flex items-center gap-1">
                        {member.isBillingPerson && <Badge variant="outline">Billing</Badge>}
                        {member.isContactPerson && <Badge variant="outline">Contact</Badge>}
                        <Badge
                          variant="secondary"
                          className={`${MEMBER_STATUS_CLASSES[member.status]} border-0`}
                        >
                          {MEMBER_STATUS_LABELS[member.status]}
                        </Badge>
                      </span>
                    }
                  />
                ))}
              </Rows>
            )}
          </Section>
          <CurrentMemberships
            memberships={memberships}
            credits={company.credits}
            viewAllHref={companyPath(company.id, "memberships")}
          />
          <OpenBilling
            invoices={invoices}
            charges={charges}
            invoicesHref={companyPath(company.id, "invoices")}
            uninvoicedHref={`${companyPath(company.id, "charges")}&uninvoiced=true`}
          />
        </div>
        <RecentActivity
          bookings={bookings}
          credits={company.credits}
          viewAllHref={companyPath(company.id, "bookings")}
          timeZone={timeZone}
        />
      </div>
    </div>
  )
}
