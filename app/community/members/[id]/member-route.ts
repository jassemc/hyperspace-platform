export const MEMBER_TABS = [
  "overview",
  "memberships",
  "bookings",
  "checkins",
  "credits",
  "charges",
  "invoices",
] as const

export type MemberTab = (typeof MEMBER_TABS)[number]

export const MEMBER_TAB_LABELS: Record<MemberTab, string> = {
  overview: "Overview",
  memberships: "Memberships",
  bookings: "Bookings",
  checkins: "Check-ins",
  credits: "Credits",
  charges: "Charges",
  invoices: "Invoices",
}

export function isMemberTab(value: string | undefined): value is MemberTab {
  return MEMBER_TABS.includes(value as MemberTab)
}

/** The one place the member URL is spelled, so links and revalidation agree. */
export function memberPath(id: string, tab?: MemberTab): string {
  const base = `/community/members/${id}`
  return tab && tab !== "overview" ? `${base}?tab=${tab}` : base
}

/** Pattern form for `revalidatePath(..., "page")`. */
export const MEMBER_ROUTE_PATTERN = "/community/members/[id]"
