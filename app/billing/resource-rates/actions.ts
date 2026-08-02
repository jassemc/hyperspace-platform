"use server"

import { revalidatePath } from "next/cache"
import { createResourceRate, updateResourceRate } from "@/lib/service"
import type { CreateResourceRateDto, UpdateResourceRateDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

export async function createResourceRateAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: CreateResourceRateDto = {
      resourceId: formData.get("resourceId") as string,
      rateType: formData.get("rateType") as CreateResourceRateDto["rateType"],
      audience: formData.get("audience") as CreateResourceRateDto["audience"],
      priceHtMillimes: Number(formData.get("priceHtMillimes")),
      vatRateBp: formData.get("vatRateBp") ? Number(formData.get("vatRateBp")) : undefined,
    }

    await createResourceRate(data)
    revalidatePath("/billing/resource-rates")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create resource rate",
    }
  }
}

export async function updateResourceRateAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const data: UpdateResourceRateDto = {
      priceHtMillimes: Number(formData.get("priceHtMillimes")),
      vatRateBp: formData.get("vatRateBp") ? Number(formData.get("vatRateBp")) : undefined,
    }

    await updateResourceRate(id, data)
    revalidatePath("/billing/resource-rates")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update resource rate",
    }
  }
}
