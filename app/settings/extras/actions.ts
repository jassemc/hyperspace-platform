"use server"

import { revalidatePath } from "next/cache"
import { createExtra, updateExtra } from "@/lib/service"
import type { CreateExtraDto, UpdateExtraDto } from "@/lib/service/HsService"

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

export async function createExtraAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = text(formData, "name")
    const priceHt = num(formData, "priceHt")

    if (!name) return { success: false, error: "Extra name is required" }
    if (priceHt === undefined || priceHt < 0) {
      return { success: false, error: "Price must be a number of 0 or more" }
    }

    const data: CreateExtraDto = {
      name,
      description: text(formData, "description"),
      priceHt,
      vatRate: num(formData, "vatRate"),
      deposit: num(formData, "deposit"),
      // Optional link to the shared amenity vocabulary for name and icon.
      amenityId: text(formData, "amenityId"),
    }

    await createExtra(data)
    revalidatePath("/settings/extras")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create extra",
    }
  }
}

export async function updateExtraAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Extra ID is required" }

    const data: UpdateExtraDto = {
      name: text(formData, "name"),
      description: text(formData, "description"),
      priceHt: num(formData, "priceHt"),
      vatRate: num(formData, "vatRate"),
      deposit: num(formData, "deposit"),
      amenityId: text(formData, "amenityId"),
    }

    await updateExtra(id, data)
    revalidatePath("/settings/extras")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update extra",
    }
  }
}
