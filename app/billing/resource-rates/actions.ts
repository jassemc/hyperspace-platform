"use server"

import { revalidatePath } from "next/cache"
import { createResourceRate, updateResourceRate } from "@/lib/service"
import type {
  CreateResourceRateDto,
  RateIntervalType,
  UpdateResourceRateDto,
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

function extraIds(formData: FormData): string[] {
  return formData
    .getAll("extraIds")
    .map((value) => String(value).trim())
    .filter(Boolean)
}

export async function createResourceRateAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = text(formData, "name")
    const resourceTypeId = text(formData, "resourceTypeId")
    const intervalType = text(formData, "intervalType") as RateIntervalType | undefined
    const priceHt = num(formData, "priceHt")

    if (!name) return { success: false, error: "Rate name is required" }
    if (!resourceTypeId) return { success: false, error: "Resource type is required" }
    if (!intervalType) return { success: false, error: "Interval is required" }
    if (priceHt === undefined || priceHt < 0) {
      return { success: false, error: "Price must be a number of 0 or more" }
    }

    const data: CreateResourceRateDto = {
      name,
      code: text(formData, "code"),
      description: text(formData, "description"),
      resourceTypeId,
      intervalType,
      // Weekend variants exist only for hour/half_day/day; the form hides the
      // control otherwise, so an absent value means a standard rate.
      isWeekendRate: formData.get("isWeekendRate") === "on",
      priceHt,
      vatRate: num(formData, "vatRate"),
      extraIds: extraIds(formData),
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
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Rate ID is required" }

    // resourceTypeId, intervalType and isWeekendRate identify the rate slot and
    // are not patchable — the update schema does not accept them.
    const data: UpdateResourceRateDto = {
      name: text(formData, "name"),
      code: text(formData, "code"),
      description: text(formData, "description"),
      priceHt: num(formData, "priceHt"),
      vatRate: num(formData, "vatRate"),
      extraIds: extraIds(formData),
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
