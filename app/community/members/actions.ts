"use server"

import { revalidatePath } from "next/cache"
import {
  createMember,
  updateMember,
  inviteMember,
  unlinkMember,
} from "@/lib/service"
import type {
  CreateMemberDto,
  InviteResponseDto,
  MemberKindHint,
  MemberSegment,
  UpdateMemberDto,
} from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  invite?: InviteResponseDto
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parseMemberPayload(formData: FormData): CreateMemberDto {
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
  }
}

export async function createMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data = parseMemberPayload(formData)
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
    revalidatePath("/community/members")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update member",
    }
  }
}

export async function inviteMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    if (!id) {
      return { success: false, error: "Member id is required" }
    }

    const invite = await inviteMember(id)
    revalidatePath("/community/members")
    return { success: true, invite }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite member",
    }
  }
}

export async function unlinkMemberAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    if (!id) {
      return { success: false, error: "Member id is required" }
    }

    await unlinkMember(id)
    revalidatePath("/community/members")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke portal access",
    }
  }
}
