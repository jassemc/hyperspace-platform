"use server"

import { revalidatePath } from "next/cache"
import { createCompany, updateCompany } from "@/lib/service"
import type {
  AddressDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parseTags(value: FormDataEntryValue | null): string[] | undefined {
  const raw = emptyToUndefined(value)
  if (!raw) return undefined
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
  return tags.length > 0 ? tags : undefined
}

function parseAddress(formData: FormData): AddressDto | undefined {
  const address: AddressDto = {
    street: emptyToUndefined(formData.get("street")),
    city: emptyToUndefined(formData.get("city")),
    state: emptyToUndefined(formData.get("state")),
    zip: emptyToUndefined(formData.get("zip")),
    country: emptyToUndefined(formData.get("country")),
  }

  const hasValue = Object.values(address).some((value) => value !== undefined)
  return hasValue ? address : undefined
}

function parseCompanyPayload(formData: FormData): CreateCompanyDto {
  const name = emptyToUndefined(formData.get("name"))
  if (!name) {
    throw new Error("Company name is required")
  }

  return {
    name,
    taxId: emptyToUndefined(formData.get("taxId")),
    email: emptyToUndefined(formData.get("email")),
    phone: emptyToUndefined(formData.get("phone")),
    website: emptyToUndefined(formData.get("website")),
    description: emptyToUndefined(formData.get("description")),
    tags: parseTags(formData.get("tags")),
    billingAddress: parseAddress(formData),
  }
}

export async function createCompanyAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data = parseCompanyPayload(formData)
    await createCompany(data)
    revalidatePath("/community/companies")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create company",
    }
  }
}

export async function updateCompanyAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    if (!id) {
      return { success: false, error: "Company id is required" }
    }

    const data: UpdateCompanyDto = parseCompanyPayload(formData)
    await updateCompany(id, data)
    revalidatePath("/community/companies")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update company",
    }
  }
}
