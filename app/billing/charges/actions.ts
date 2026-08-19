"use server"

import { revalidatePath } from "next/cache"
import { createCharge } from "@/lib/service"
import type { CreateChargeDto } from "@/lib/service/HsService"
import { CREATABLE_CHARGE_KINDS, type CreatableChargeKind } from "./charge-meta"

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

export async function createChargeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const kind = text(formData, "kind") as CreatableChargeKind | undefined
    const memberId = text(formData, "memberId")
    const companyId = text(formData, "companyId")

    if (!kind || !CREATABLE_CHARGE_KINDS.includes(kind)) {
      return { success: false, error: "Select a charge kind that can be raised manually" }
    }
    if (!memberId && !companyId) return { success: false, error: "Select a member or a company" }
    if (memberId && companyId) {
      return { success: false, error: "A charge belongs to a member or a company, not both" }
    }

    const data: CreateChargeDto = {
      kind,
      memberId,
      companyId,
      planId: text(formData, "planId"),
      description: text(formData, "description"),
      amountHt: num(formData, "amountHt"),
      vatRate: num(formData, "vatRate"),
      accountingCode: text(formData, "accountingCode"),
    }

    await createCharge(data)
    revalidatePath("/billing/charges")
    revalidatePath("/billing/invoices")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create charge",
    }
  }
}
