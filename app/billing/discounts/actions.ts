"use server"

import { revalidatePath } from "next/cache"
import { archiveDiscount, createDiscount, updateDiscount } from "@/lib/service"
import type { CreateDiscountDto, DiscountKind, UpdateDiscountDto } from "@/lib/service/HsService"

export type ActionState = { success?: boolean; error?: string }

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
function ids(formData: FormData, field: string): string[] {
  return formData.getAll(field).map((v) => String(v).trim()).filter(Boolean)
}

/** Shared by create and update: one value type, right targets for the kind. */
function readValueAndTargets(formData: FormData, kind: DiscountKind): { error?: string; data?: Partial<CreateDiscountDto> } {
  const valueType = text(formData, "valueType") // "percent" | "amount"
  const percentOff = valueType === "percent" ? num(formData, "percentOff") : undefined
  const amountOffHt = valueType === "amount" ? num(formData, "amountOffHt") : undefined
  if (percentOff === undefined && amountOffHt === undefined) {
    return { error: "Enter a percent off or an amount off" }
  }
  if (percentOff !== undefined && (percentOff <= 0 || percentOff > 100)) {
    return { error: "Percent off must be between 0 and 100" }
  }
  if (amountOffHt !== undefined && amountOffHt <= 0) {
    return { error: "Amount off must be greater than 0" }
  }
  const planIds = kind === "plan" ? ids(formData, "planIds") : []
  const resourceRateIds = kind === "resource_rate" ? ids(formData, "resourceRateIds") : []
  if (kind === "plan" && planIds.length === 0) return { error: "Pick at least one plan" }
  if (kind === "resource_rate" && resourceRateIds.length === 0) return { error: "Pick at least one resource rate" }
  const validFrom = kind === "promo" ? text(formData, "validFrom") : undefined
  const validUntil = kind === "promo" ? text(formData, "validUntil") : undefined
  if (validFrom && validUntil && validUntil < validFrom) return { error: "Valid until cannot be before valid from" }
  return { data: { percentOff, amountOffHt, planIds, resourceRateIds, validFrom, validUntil } }
}

export async function createDiscountAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const name = text(formData, "name")
    const code = text(formData, "code")
    const kind = text(formData, "kind") as DiscountKind | undefined
    if (!name) return { success: false, error: "Name is required" }
    if (!code) return { success: false, error: "Code is required" }
    if (!kind) return { success: false, error: "Kind is required" }
    const read = readValueAndTargets(formData, kind)
    if (read.error) return { success: false, error: read.error }
    const data: CreateDiscountDto = { name, code, kind, ...read.data }
    await createDiscount(data)
    revalidatePath("/billing/discounts")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create discount" }
  }
}

export async function updateDiscountAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const kind = text(formData, "kind") as DiscountKind | undefined // hidden field; kind is immutable
    if (!id || !kind) return { success: false, error: "Discount ID is required" }
    const read = readValueAndTargets(formData, kind)
    if (read.error) return { success: false, error: read.error }
    const data: UpdateDiscountDto = { name: text(formData, "name"), code: text(formData, "code"), ...read.data }
    await updateDiscount(id, data)
    revalidatePath("/billing/discounts")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update discount" }
  }
}

export async function archiveDiscountAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Discount ID is required" }
    await archiveDiscount(id)
    revalidatePath("/billing/discounts")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to archive discount" }
  }
}
