export const COMPANY_TABS = [
  "overview",
  "members",
  "memberships",
  "bookings",
  "credits",
  "charges",
  "invoices",
] as const

export type CompanyTab = (typeof COMPANY_TABS)[number]

export const COMPANY_TAB_LABELS: Record<CompanyTab, string> = {
  overview: "Overview",
  members: "Members",
  memberships: "Memberships",
  bookings: "Bookings",
  credits: "Credits",
  charges: "Charges",
  invoices: "Invoices",
}

/** The old Plans tab kept its URL, so bookmarks and links keep working. */
const TAB_ALIASES: Record<string, CompanyTab> = { plans: "memberships" }

export function resolveCompanyTab(value: string | undefined): CompanyTab {
  if (!value) return "overview"
  if (COMPANY_TABS.includes(value as CompanyTab)) return value as CompanyTab
  return TAB_ALIASES[value] ?? "overview"
}

/** The one place the company URL is spelled, so links and revalidation agree. */
export function companyPath(id: string, tab?: CompanyTab): string {
  const base = `/community/companies/${id}`
  return tab && tab !== "overview" ? `${base}?tab=${tab}` : base
}

/** Pattern form for `revalidatePath(..., "page")`. */
export const COMPANY_ROUTE_PATTERN = "/community/companies/[id]"
