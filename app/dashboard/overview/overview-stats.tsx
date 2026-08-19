import {
    getListMembers,
    getListMemberships,
    getListCheckins,
    getListBookings,
    getListInvoices,
} from "@/lib/service"
import type {
    BookingDto,
    CheckinDto,
    InvoiceDto,
    MemberDto,
    MembershipDto,
} from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { formatPriceHt } from "@/lib/format"
import { StatCards } from "@/components/stat-cards"
import { UsersIcon, BadgeCheckIcon, DoorOpenIcon, AlertTriangleIcon } from "lucide-react"

/**
 * Headline numbers across the domains. Each figure comes from its own endpoint,
 * and a failing one degrades to a dash rather than taking the page down.
 */
export async function OverviewStats() {
    const [members, memberships, checkins, bookings, invoices] = await Promise.all([
        getListMembers({ limit: 1, offset: 0, sort: "ASC" }).catch(() => null),
        getListMemberships({ limit: 100, offset: 0, sort: "ASC", status: "active" }).catch(() => null),
        getListCheckins({ limit: 100, offset: 0, sort: "DESC" }).catch(() => null),
        getListBookings({ limit: 100, offset: 0, sort: "ASC" }).catch(() => null),
        getListInvoices({ limit: 100, offset: 0, sort: "DESC" }).catch(() => null),
    ])

    const memberTotal = members ? pageResult<MemberDto>(members).total : null
    const activeMemberships = memberships ? pageResult<MembershipDto>(memberships).total : null

    // An open interval — checked in but not yet out — means someone is on site.
    const onSite = checkins
        ? pageResult<CheckinDto>(checkins).results.filter((checkin) => !checkin.checkedOutAt).length
        : null

    const pendingBookings = bookings
        ? pageResult<BookingDto>(bookings).results.filter((booking) => booking.status === "pending").length
        : null

    const outstanding = invoices
        ? pageResult<InvoiceDto>(invoices)
              .results.filter((invoice) => invoice.status !== "void")
              .reduce((sum, invoice) => sum + Math.max(0, invoice.totalTtc - invoice.paid), 0)
        : null

    const show = (value: number | null) => (value === null ? "-" : value)

    return (
        <StatCards
            cards={[
                {
                    label: "Members",
                    value: show(memberTotal),
                    badge: "CRM",
                    icon: UsersIcon,
                    footer: "Everyone on record",
                },
                {
                    label: "Active memberships",
                    value: show(activeMemberships),
                    badge: "Live",
                    icon: BadgeCheckIcon,
                    footer: "Currently running",
                },
                {
                    label: "On site now",
                    value: show(onSite),
                    badge: "Open",
                    icon: DoorOpenIcon,
                    footer: `${pendingBookings ?? "-"} bookings awaiting confirmation`,
                },
                {
                    label: "Outstanding",
                    value: outstanding === null ? "-" : formatPriceHt(outstanding),
                    badge: "Unpaid",
                    icon: AlertTriangleIcon,
                    footer: "Invoiced but not collected",
                },
            ]}
        />
    )
}
