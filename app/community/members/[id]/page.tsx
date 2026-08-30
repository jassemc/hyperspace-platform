import Link from "next/link"
import { notFound } from "next/navigation"
import { getMember } from "@/lib/service"
import type { MemberDetailsDto } from "@/lib/service/HsService"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { firstParam } from "@/lib/search-params"
import { isMemberTab, type MemberTab } from "./member-route"
import { MemberTabs, type MemberTabCounts } from "./member-tabs"
import { IdentityCard } from "./identity-card"
import { OverviewTab } from "./overview-tab"
import { MembershipsTab } from "./memberships-tab"
import { BookingsTab } from "./bookings-tab"
import { CheckinsTab } from "./checkins-tab"
import { CreditsTab } from "./credits-tab"
import { ChargesTab } from "./charges-tab"
import { InvoicesTab } from "./invoices-tab"

export default async function MemberDetailsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const requested = firstParam(resolvedSearchParams?.tab)
  const activeTab: MemberTab = isMemberTab(requested) ? requested : "overview"

  // One request: the member row plus every Overview block (spec §0).
  let member: MemberDetailsDto
  try {
    member = (await getMember(id)) as MemberDetailsDto
  } catch (error) {
    console.warn(`Failed to load member ${id}`, error)
    notFound()
  }

  // What each tab holds, so staff know where to look before clicking.
  const counts: MemberTabCounts = {
    memberships: member.memberships.total,
    bookings: member.bookings.upcoming,
    checkins: member.checkins.total,
    credits: member.credits.recent.length,
    charges: member.charges.uninvoiced,
    invoices: member.invoices.open,
  }

  return (
    <div className="w-full py-6">
      <div className="px-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link href="/community/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to members
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 px-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <IdentityCard member={member} />
        <div className="min-w-0">
          <MemberTabs activeTab={activeTab} counts={counts}>
            {activeTab === "overview" && <OverviewTab member={member} />}
            {activeTab === "memberships" && (
              <MembershipsTab member={member} searchParams={resolvedSearchParams} />
            )}
            {activeTab === "bookings" && (
              <BookingsTab member={member} searchParams={resolvedSearchParams} />
            )}
            {activeTab === "checkins" && (
              <CheckinsTab member={member} searchParams={resolvedSearchParams} />
            )}
            {activeTab === "credits" && (
              <CreditsTab member={member} searchParams={resolvedSearchParams} />
            )}
            {activeTab === "charges" && (
              <ChargesTab member={member} searchParams={resolvedSearchParams} />
            )}
            {activeTab === "invoices" && (
              <InvoicesTab member={member} searchParams={resolvedSearchParams} />
            )}
          </MemberTabs>
        </div>
      </div>
    </div>
  )
}
