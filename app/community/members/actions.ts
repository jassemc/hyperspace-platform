"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import {
  createMember,
  updateMember,
  updateMemberStatus,
  updateMemberCompany,
} from "@/lib/service"
import type {
  CreateMemberDto,
  MemberKindHint,
  MemberSegment,
  MemberStatusUpdate,
  UpdateMemberDto,
} from "@/lib/service/HsService"
import { type ActionState, problem, text, clearableText, tags } from "@/lib/action-state"
import { MEMBER_ROUTE_PATTERN } from "./[id]/member-route"


function revalidate() {
  revalidatePath("/community/members")
  revalidatePath(MEMBER_ROUTE_PATTERN, "page")
  // A member's employer change moves company figures too.
  revalidateTag("stats:members")
  revalidateTag("stats:companies")
}

/**
 * Fields common to create and update. `companyId` is deliberately absent —
 * employment moves through PUT /members/:id/company, not the member patch.
 */
function parseMemberPayload(formData: FormData): UpdateMemberDto {
  const fullName = text(formData, "fullName")
  if (!fullName) {
    throw new Error("Full name is required")
  }

  return {
    fullName,
    // Format-validated by the API: "" fails @IsEmail/@IsUrl, so a blank field is omitted rather than cleared.
    email: text(formData, "email"),
    phone: clearableText(formData, "phone"),
    notes: clearableText(formData, "notes"),
    kindHint: (text(formData, "kindHint") as MemberKindHint) || undefined,
    segment: (text(formData, "segment") as MemberSegment) || undefined,
    // Both roles are company-scoped and rejected without an employer.
    isBillingPerson: formData.get("isBillingPerson") === "on",
    isContactPerson: formData.get("isContactPerson") === "on",
    tags: tags(formData),
  }
}

/** Both roles are company-scoped; the API refuses them without an employer. */
function roleWithoutCompany(payload: UpdateMemberDto, companyId: string | undefined): ActionState | null {
  if ((payload.isBillingPerson || payload.isContactPerson) && !companyId) {
    return { success: false, error: "Billing and contact roles need an employer. Pick a company first." }
  }
  return null
}

export async function createMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const companyId = text(formData, "companyId")
    const payload = parseMemberPayload(formData)

    const roleError = roleWithoutCompany(payload, companyId)
    if (roleError) return roleError

    const data: CreateMemberDto = {
      ...payload,
      fullName: payload.fullName as string,
      companyId,
    }

    await createMember(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to create member")
  }
}

export async function updateMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    if (!id) {
      return { success: false, error: "Member id is required" }
    }

    const data: UpdateMemberDto = parseMemberPayload(formData)
    const companyId = text(formData, "companyId")

    const roleError = roleWithoutCompany(data, companyId)
    if (roleError) return roleError

    await updateMember(id, data)

    // Employment is a separate endpoint; only call it when the form changed it.
    const previousCompanyId = text(formData, "previousCompanyId")
    if (companyId !== previousCompanyId) {
      await updateMemberCompany(id, { companyId: companyId ?? null })
    }

    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to update member")
  }
}

/**
 * Pins or clears the lifecycle status. Replaces the removed portal invite and
 * unlink actions, which the API no longer exposes.
 */
export async function updateMemberStatusAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    if (!id) {
      return { success: false, error: "Member id is required" }
    }

    const status = text(formData, "status") as MemberStatusUpdate | undefined
    if (!status) {
      return { success: false, error: "Status is required" }
    }

    await updateMemberStatus(id, { status })
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to update status")
  }
}
