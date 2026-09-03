"use server"

import { revalidatePath } from "next/cache"
import { MEMBER_ROUTE_PATTERN } from "@/app/community/members/[id]/member-route"
import { COMPANY_ROUTE_PATTERN } from "@/app/community/companies/[id]/company-route"
import { grantCredit, updateCredit, deleteCredit } from "@/lib/service"
import type { GrantCreditDto, UpdateCreditDto } from "@/lib/service/HsService"

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
  revalidatePath("/billing/credits")
  revalidatePath(MEMBER_ROUTE_PATTERN, "page")
  revalidatePath(COMPANY_ROUTE_PATTERN, "page")
}

export async function grantCreditAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const membershipId = text(formData, "membershipId")
    const creditType = text(formData, "creditType")
    const amount = num(formData, "amount")

    if (!membershipId) return { success: false, error: "Select a membership" }
    if (!creditType) return { success: false, error: "A credit type is required" }
    if (amount === undefined || amount <= 0) {
      return { success: false, error: "Enter an amount greater than 0" }
    }

    const data: GrantCreditDto = {
      membershipId,
      creditType,
      amount,
      expiresAt: text(formData, "expiresAt"),
      // Scopes the grant to one resource type when set.
      resourceTypeId: text(formData, "resourceTypeId"),
      reason: text(formData, "reason"),
    }

    await grantCredit(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grant credit",
    }
  }
}

export async function updateCreditAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Credit ID is required" }

    const data: UpdateCreditDto = {
      expiresAt: text(formData, "expiresAt"),
      // `UpdateCreditDto.resourceTypeId` is typed `object | null` by the
      // generator because the schema declares the nullable uuid as a bare
      // object. It carries a uuid string at runtime. See lib/api-value.ts.
      resourceTypeId: text(formData, "resourceTypeId") as unknown as UpdateCreditDto["resourceTypeId"],
      reason: text(formData, "reason"),
    }

    await updateCredit(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update credit",
    }
  }
}

export async function deleteCreditAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Credit ID is required" }

    await deleteCredit(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete credit",
    }
  }
}
