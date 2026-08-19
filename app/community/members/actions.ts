"use server"

import { revalidatePath } from "next/cache"
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

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function tags(formData: FormData): string[] | undefined {
  const raw = emptyToUndefined(formData.get("tags"))
  if (!raw) return undefined
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * Fields common to create and update. `companyId` is deliberately absent —
 * employment moves through PUT /members/:id/company, not the member patch.
 */
function parseMemberPayload(formData: FormData): UpdateMemberDto {
  const fullName = emptyToUndefined(formData.get("fullName"))
  if (!fullName) {
    throw new Error("Full name is required")
  }

  return {
    fullName,
    email: emptyToUndefined(formData.get("email")),
    phone: emptyToUndefined(formData.get("phone")),
    notes: emptyToUndefined(formData.get("notes")),
    kindHint: (emptyToUndefined(formData.get("kindHint")) as MemberKindHint) || undefined,
    segment: (emptyToUndefined(formData.get("segment")) as MemberSegment) || undefined,
    // Both roles are company-scoped and rejected without an employer.
    isBillingPerson: formData.get("isBillingPerson") === "on",
    isContactPerson: formData.get("isContactPerson") === "on",
    tags: tags(formData),
  }
}

export async function createMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const companyId = emptyToUndefined(formData.get("companyId"))
    const payload = parseMemberPayload(formData)

    if (!companyId && (payload.isBillingPerson || payload.isContactPerson)) {
      return {
        success: false,
        error: "Billing and contact roles require an employer company",
      }
    }

    const data: CreateMemberDto = {
      ...payload,
      fullName: payload.fullName as string,
      companyId,
    }

    await createMember(data)
    revalidatePath("/community/members")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create member",
    }
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
    await updateMember(id, data)

    // Employment is a separate endpoint; only call it when the form changed it.
    const companyId = emptyToUndefined(formData.get("companyId"))
    const previousCompanyId = emptyToUndefined(formData.get("previousCompanyId"))
    if (companyId !== previousCompanyId) {
      await updateMemberCompany(id, { companyId: companyId ?? null })
    }

    revalidatePath("/community/members")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update member",
    }
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

    const status = emptyToUndefined(formData.get("status")) as MemberStatusUpdate | undefined
    if (!status) {
      return { success: false, error: "Status is required" }
    }

    await updateMemberStatus(id, { status })
    revalidatePath("/community/members")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update member status",
    }
  }
}
