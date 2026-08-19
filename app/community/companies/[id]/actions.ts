"use server"

import { revalidatePath } from "next/cache"
import {
  cancelMembership,
  createMembership,
  getListCompanies,
  getListMembers,
  getListPlans,
  renewMembership,
  updateMemberCompany,
} from "@/lib/service"
import type {
  CompanyDto,
  CreateMembershipDto,
  MemberDto,
  PlanDto,
} from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function revalidateCompany(companyId: string) {
  revalidatePath(`/community/companies/${companyId}`)
  revalidatePath("/community/companies")
  revalidatePath("/community/members")
}

/**
 * Members that can still be attached: the API has no "unaffiliated" filter, so
 * a page is pulled and the ones already tied to a company are dropped here.
 */
export async function searchAttachableMembers(query: string): Promise<MemberDto[]> {
  try {
    const response = (await getListMembers({
      limit: 50,
      offset: 0,
      sort: "ASC",
      q: query.trim() || undefined,
    })) as { results?: MemberDto[] }

    return (response.results ?? []).filter((member) => !member.companyId)
  } catch (error) {
    console.warn("Failed to search attachable members", error)
    return []
  }
}

export async function listCompanyOptions(): Promise<CompanyDto[]> {
  try {
    const response = (await getListCompanies({
      limit: 100,
      offset: 0,
      sort: "ASC",
    })) as { results?: CompanyDto[] }

    return response.results ?? []
  } catch (error) {
    console.warn("Failed to load companies", error)
    return []
  }
}

/** Members already attached to the company — the only valid subscribers here. */
export async function listCompanyMemberOptions(companyId: string): Promise<MemberDto[]> {
  try {
    const response = (await getListMembers({
      limit: 100,
      offset: 0,
      sort: "ASC",
      companyId,
    })) as { results?: MemberDto[] }

    return response.results ?? []
  } catch (error) {
    console.warn(`Failed to load members of company ${companyId}`, error)
    return []
  }
}

export async function listPlanOptions(): Promise<PlanDto[]> {
  try {
    const response = (await getListPlans({
      limit: 100,
      offset: 0,
      sort: "ASC",
      status: "active",
    })) as { results?: PlanDto[] }

    return response.results ?? []
  } catch (error) {
    console.warn("Failed to load plans", error)
    return []
  }
}

export async function attachMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const companyId = emptyToUndefined(formData.get("companyId"))
    const memberId = emptyToUndefined(formData.get("memberId"))

    if (!companyId) return { success: false, error: "Company id is required" }
    if (!memberId) return { success: false, error: "Select a member to attach" }

    await updateMemberCompany(memberId, { companyId })
    revalidateCompany(companyId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to attach member",
    }
  }
}

/**
 * Moves a member to another company via PUT /members/:id/company. That
 * endpoint accepts null to detach a member into a solo membership.
 */
export async function reassignMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const memberId = emptyToUndefined(formData.get("memberId"))
    const targetCompanyId = emptyToUndefined(formData.get("targetCompanyId"))
    const currentCompanyId = emptyToUndefined(formData.get("currentCompanyId"))

    if (!memberId) return { success: false, error: "Member id is required" }
    if (!targetCompanyId) return { success: false, error: "Select a company" }
    if (targetCompanyId === currentCompanyId) {
      return { success: false, error: "Member already belongs to this company" }
    }

    await updateMemberCompany(memberId, { companyId: targetCompanyId })
    if (currentCompanyId) revalidateCompany(currentCompanyId)
    revalidateCompany(targetCompanyId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reassign member",
    }
  }
}

/**
 * Memberships validate customer as member XOR company, so a subscription made
 * from a company page is written against the member. `companyId` is carried on
 * the form only to revalidate the page the user is standing on.
 */
export async function subscribeMemberToPlanAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const companyId = emptyToUndefined(formData.get("companyId"))
    const memberId = emptyToUndefined(formData.get("memberId"))
    const planId = emptyToUndefined(formData.get("planId"))
    const startsAt = emptyToUndefined(formData.get("startsAt"))

    if (!memberId) return { success: false, error: "Select a member" }
    if (!planId) return { success: false, error: "Select a plan" }
    if (!startsAt) return { success: false, error: "Start date is required" }

    const data: CreateMembershipDto = {
      memberId,
      planId,
      startsAt,
      notes: emptyToUndefined(formData.get("notes")),
    }

    await createMembership(data)
    if (companyId) revalidateCompany(companyId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe to plan",
    }
  }
}

export async function cancelMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = emptyToUndefined(formData.get("id"))
    const companyId = emptyToUndefined(formData.get("companyId"))
    if (!id) return { success: false, error: "Membership id is required" }

    await cancelMembership(id)
    if (companyId) revalidateCompany(companyId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel membership",
    }
  }
}

export async function renewMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = emptyToUndefined(formData.get("id"))
    const companyId = emptyToUndefined(formData.get("companyId"))
    if (!id) return { success: false, error: "Membership id is required" }

    await renewMembership(id)
    if (companyId) revalidateCompany(companyId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to renew membership",
    }
  }
}
