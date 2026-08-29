"use server"

import { revalidatePath } from "next/cache"
import { createMembership, updateMembership, cancelMembership, renewMembership } from "@/lib/service"
import type { CreateMembershipDto, UpdateMembershipDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function num(formData: FormData, field: string): number | undefined {
  const raw = text(formData, field)
  if (raw === undefined) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function revalidate() {
  revalidatePath("/community/memberships")
  revalidatePath("/community/members")
  revalidatePath("/community/companies")
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
      extraIds: formData.getAll("extraIds").map(String).filter(Boolean),
      discountId: text(formData, "discountId"),
    }

    await createMembership(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create membership",
    }
  }
}

/** Only the label, notes and discount are patchable; terms live in the plan snapshot. */
export async function updateMembershipAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    const data: UpdateMembershipDto = {
      name: text(formData, "name"),
      notes: text(formData, "notes"),
      // A DISABLED select is excluded from FormData entirely, so only treat
      // the field as "cleared" when it was actually submitted.
      discountId: formData.has("discountId") ? (text(formData, "discountId") ?? null) : undefined,
    }

    await updateMembership(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update membership",
    }
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
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    await renewMembership(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to renew membership",
    }
  }
}
