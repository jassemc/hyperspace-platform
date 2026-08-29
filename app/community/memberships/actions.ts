"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { MEMBER_ROUTE_PATTERN } from "@/app/community/members/[id]/member-route"
import {
  createMembership,
  updateMembership,
  cancelMembership,
  renewMembership,
  pauseMembership,
  resumeMembership,
} from "@/lib/service"
import type {
  CreateMembershipDto,
  CreateMembershipPauseDto,
  ResumeMembershipDto,
  UpdateMembershipDto,
} from "@/lib/service/HsService"
import { type ActionState, problem, text, clearableText, num } from "@/lib/action-state"


function revalidate() {
  revalidatePath("/community/memberships")
  revalidatePath("/community/members")
  revalidatePath("/community/companies")
  revalidatePath(MEMBER_ROUTE_PATTERN, "page")
  revalidateTag("stats:memberships")
  // Member/company status derive from memberships.
  revalidateTag("stats:members")
  revalidateTag("stats:companies")
}

export async function createMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const planId = text(formData, "planId")
    const startsAt = text(formData, "startsAt")
    const memberId = text(formData, "memberId")
    const companyId = text(formData, "companyId")

    if (!planId) return { success: false, error: "Select a plan" }
    if (!startsAt) return { success: false, error: "Start date is required" }
    // The API validates customer as member XOR company.
    if (!memberId && !companyId) return { success: false, error: "Select a member or a company" }
    if (memberId && companyId) {
      return { success: false, error: "A membership belongs to a member or a company, not both" }
    }

    const data: CreateMembershipDto = {
      memberId,
      companyId,
      planId,
      startsAt,
      endsAt: text(formData, "endsAt"),
      notes: text(formData, "notes"),
      name: text(formData, "name"),
      // Both override the plan's catalog values for this membership only.
      priceHt: num(formData, "priceHt"),
      deposit: num(formData, "deposit"),
      setupFee: num(formData, "setupFee"),
      extraIds: formData.getAll("extraIds").map(String).filter(Boolean),
      discountId: text(formData, "discountId"),
    }

    await createMembership(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to create membership")
  }
}

/**
 * Only the label, notes, discount and end date are patchable; the other
 * terms live in the plan snapshot.
 */
export async function updateMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    const data: UpdateMembershipDto = {
      name: text(formData, "name"),
      notes: clearableText(formData, "notes"),
      // Only treat the field as "cleared" when it was actually submitted.
      discountId: formData.has("discountId") ? (text(formData, "discountId") ?? null) : undefined,
      // Same shape: a submitted-but-blank date means "open-ended", omitted
      // means "leave it alone". No notice period applies — see the dialog.
      endsAt: formData.has("endsAt") ? (text(formData, "endsAt") ?? null) : undefined,
    }

    await updateMembership(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to update membership")
  }
}

export async function cancelMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    await cancelMembership(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to cancel membership")
  }
}

export async function renewMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    await renewMembership(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to renew membership")
  }
}

export async function pauseMembershipAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const startsAt = text(formData, "startsAt")
    if (!id) return { success: false, error: "Membership ID is required" }
    if (!startsAt) return { success: false, error: "A pause needs a start date" }

    const data: CreateMembershipPauseDto = {
      startsAt,
      endsAt: text(formData, "endsAt"),
      reason: text(formData, "reason"),
    }
    await pauseMembership(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to pause membership")
  }
}

export async function resumeMembershipAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    const data: ResumeMembershipDto = { endsAt: text(formData, "endsAt") }
    await resumeMembership(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to resume membership")
  }
}
