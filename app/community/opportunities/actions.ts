"use server"

import { revalidatePath } from "next/cache"
import { createOpportunity, updateOpportunity } from "@/lib/service"
import type {
  CreateOpportunityDto,
  OpportunityInterest,
  OpportunityStage,
  UpdateOpportunityDto,
} from "@/lib/service/HsService"

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

function opportunityFields(formData: FormData) {
  return {
    memberId: text(formData, "memberId"),
    interest: text(formData, "interest") as OpportunityInterest | undefined,
    stage: text(formData, "stage") as OpportunityStage | undefined,
    expectedValue: num(formData, "expectedValue"),
    source: text(formData, "source"),
    notes: text(formData, "notes"),
    requestedPlanId: text(formData, "requestedPlanId"),
    requestedPlanPriceHt: num(formData, "requestedPlanPriceHt"),
  }
}

export async function createOpportunityAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const fields = opportunityFields(formData)

    if (!fields.memberId) return { success: false, error: "Select a member" }
    if (!fields.interest) return { success: false, error: "Select what they are interested in" }

    const data: CreateOpportunityDto = {
      ...fields,
      memberId: fields.memberId,
      interest: fields.interest,
      // Required by the schema; an opportunity always carries a list.
      requestedExtras: [],
    }

    await createOpportunity(data)
    revalidatePath("/community/opportunities")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create opportunity",
    }
  }
}

export async function updateOpportunityAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Opportunity ID is required" }

    const data: UpdateOpportunityDto = opportunityFields(formData)

    await updateOpportunity(id, data)
    revalidatePath("/community/opportunities")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update opportunity",
    }
  }
}
