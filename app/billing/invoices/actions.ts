"use server"

import { revalidatePath } from "next/cache"
import { createInvoice, recordPayment, voidInvoice } from "@/lib/service"
import type { CreateInvoiceDto, CreatePaymentDto, PaymentMethod } from "@/lib/service/HsService"

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
  revalidatePath("/billing/invoices")
  revalidatePath("/billing/charges")
}

export async function createInvoiceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const memberId = text(formData, "memberId")
    const companyId = text(formData, "companyId")

    if (!memberId && !companyId) return { success: false, error: "Select a member or a company" }
    if (memberId && companyId) {
      return { success: false, error: "An invoice is billed to a member or a company, not both" }
    }

    const chargeIds = formData.getAll("chargeIds").map(String).filter(Boolean)
    if (chargeIds.length === 0) {
      return { success: false, error: "Select at least one charge to invoice" }
    }

    const data: CreateInvoiceDto = {
      memberId,
      companyId,
      chargeIds,
      dueAt: text(formData, "dueAt"),
    }

    await createInvoice(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create invoice",
    }
  }
}

export async function recordPaymentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const amount = num(formData, "amount")
    const method = text(formData, "method") as PaymentMethod | undefined

    if (!id) return { success: false, error: "Invoice ID is required" }
    if (amount === undefined || amount <= 0) {
      return { success: false, error: "Enter an amount greater than 0" }
    }
    if (!method) return { success: false, error: "Select a payment method" }

    const data: CreatePaymentDto = {
      amount,
      method,
      reference: text(formData, "reference"),
      paidAt: text(formData, "paidAt"),
    }

    await recordPayment(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record payment",
    }
  }
}

export async function voidInvoiceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Invoice ID is required" }

    await voidInvoice(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to void invoice",
    }
  }
}
