import { escalateAuthError } from "@/lib/auth/api-auth"
import { cache } from "react"
import { getListCompanies, getListMembers, getListResources } from "@/lib/service"
import type { CompanyDto, MemberDto, ResourceDto } from "@/lib/service/HsService"

/** What the booking form's selects need before it can open. */
export interface BookingLookups {
  /** Bookable resources only: the API refuses the rest. */
  resources: ResourceDto[]
  members: MemberDto[]
  companies: CompanyDto[]
}

const PAGE = { limit: 100, offset: 0, sort: "ASC" as const }

/**
 * The three lists the create dialog renders, fetched ONCE per request on the
 * server and handed to every place that can open the form (the header
 * button, the table, the calendar). Fetching them in the dialog's mount
 * effect instead made opening it cost three server-action POSTs, every
 * time. `cache()` dedupes the table section's own resources call with this
 * one.
 */
export const bookingLookups = cache(async (): Promise<BookingLookups> => {
  const [resourcePage, memberPage, companyPage] = await Promise.all([
    getListResources({ ...PAGE, canBook: true }).catch((error) => {
      escalateAuthError(error)
      console.warn("Failed to load resources", error)
      return null
    }),
    getListMembers(PAGE).catch((error) => {
      escalateAuthError(error)
      console.warn("Failed to load members", error)
      return null
    }),
    getListCompanies(PAGE).catch((error) => {
      escalateAuthError(error)
      console.warn("Failed to load companies", error)
      return null
    }),
  ])
  return {
    resources: (resourcePage?.results ?? []) as ResourceDto[],
    members: (memberPage?.results ?? []) as MemberDto[],
    companies: (companyPage?.results ?? []) as CompanyDto[],
  }
})
