"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import {
  createMembership,
  getListCompanies,
  getListMembers,
  getListPlans,
  updateMemberCompany,
} from "@/lib/service"
import type {
  CompanyDto,
  CreateMembershipDto,
  MemberDto,
  PlanDto,
} from "@/lib/service/HsService"
import { type ActionState, problem, text } from "@/lib/action-state"
import {
  cancelMembershipAction as cancelMembership,
  renewMembershipAction as renewMembership,
  pauseMembershipAction as pauseMembership,
  resumeMembershipAction as resumeMembership,
} from "@/app/community/memberships/actions"


function revalidateCompany(companyId: string) {
  revalidatePath(`/community/companies/${companyId}`)
  revalidatePath("/community/companies")
  revalidatePath("/community/members")
  revalidateTag("stats:companies")
  revalidateTag("stats:members")
  revalidateTag("stats:memberships")
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
    const companyId = text(formData, "companyId")
    const memberId = text(formData, "memberId")

    if (!companyId) return { success: false, error: "Company id is required" }
    if (!memberId) return { success: false, error: "Select a member to attach" }

    await updateMemberCompany(memberId, { companyId })
    revalidateCompany(companyId)
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to attach member")
  }
}

/**
 * Moves a member to another company via PUT /members/:id/company. That
 * endpoint accepts null to detach a member into a solo membership — and now
 * so does this action.
 */
export async function reassignMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const memberId = text(formData, "memberId")
    const targetCompanyId = text(formData, "targetCompanyId")
    const currentCompanyId = text(formData, "currentCompanyId")
    const detach = formData.get("detach") === "on"

    if (!memberId) return { success: false, error: "Member id is required" }
    if (!detach && !targetCompanyId) {
      return { success: false, error: "Select a company or choose to detach" }
    }
    if (targetCompanyId && targetCompanyId === currentCompanyId) {
      return { success: false, error: "Member already belongs to this company" }
    }

    await updateMemberCompany(memberId, { companyId: detach ? null : targetCompanyId ?? null })
    if (currentCompanyId) revalidateCompany(currentCompanyId)
    if (targetCompanyId) revalidateCompany(targetCompanyId)
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to reassign member")
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
    const companyId = text(formData, "companyId")
    const memberId = text(formData, "memberId")
    const planId = text(formData, "planId")
    const startsAt = text(formData, "startsAt")

    if (!memberId) return { success: false, error: "Select a member" }
    if (!planId) return { success: false, error: "Select a plan" }
    if (!startsAt) return { success: false, error: "Start date is required" }

    const data: CreateMembershipDto = {
      memberId,
      planId,
      startsAt,
      notes: text(formData, "notes"),
    }

    await createMembership(data)
    if (companyId) revalidateCompany(companyId)
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to subscribe to plan")
  }
}

/**
 * The memberships module owns the lifecycle; these only add the company page
 * to what gets revalidated, since the plans tab is what the user is looking at.
 */
async function onCompanyPage(
  run: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  formData: FormData
): Promise<ActionState> {
  const result = await run({}, formData)
  const companyId = text(formData, "companyId")
  if (result.success && companyId) revalidateCompany(companyId)
  return result
}

export async function cancelCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(cancelMembership, formData) }
export async function renewCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(renewMembership, formData) }
export async function pauseCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(pauseMembership, formData) }
export async function resumeCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(resumeMembership, formData) }
