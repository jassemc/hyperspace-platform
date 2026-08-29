"use server"

import { revalidatePath } from "next/cache"
import { createCompany, updateCompany } from "@/lib/service"
import type {
  AddressDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from "@/lib/service/HsService"
import { type ActionState, problem, text, clearableText, tags } from "@/lib/action-state"


function revalidate(id?: string) {
  revalidatePath("/community/companies")
  if (id) revalidatePath(`/community/companies/${id}`)
}

function parseAddress(formData: FormData): AddressDto | undefined {
  const address: AddressDto = {
    street: text(formData, "street"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    zip: text(formData, "zip"),
    country: text(formData, "country"),
  }

  const hasValue = Object.values(address).some((value) => value !== undefined)
  return hasValue ? address : undefined
}

function parseCompanyPayload(formData: FormData): CreateCompanyDto {
  const name = text(formData, "name")
  if (!name) {
    throw new Error("Company name is required")
  }

  return {
    name,
    taxId: clearableText(formData, "taxId"),
    // Format-validated by the API: "" fails @IsEmail/@IsUrl, so a blank field is omitted rather than cleared.
    email: text(formData, "email"),
    phone: clearableText(formData, "phone"),
    // Format-validated by the API: "" fails @IsEmail/@IsUrl, so a blank field is omitted rather than cleared.
    website: text(formData, "website"),
    description: clearableText(formData, "description"),
    billingName: clearableText(formData, "billingName"),
    registrationNumber: clearableText(formData, "registrationNumber"),
    // A blank date clears it on update; on create it's simply omitted.
    startDate: text(formData, "startDate"),
    tags: tags(formData),
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
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to create company")
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

    const data: UpdateCompanyDto = {
      ...parseCompanyPayload(formData),
      // A blank date clears it; the DTO takes `null` for that, not "".
      startDate: clearableText(formData, "startDate") || null,
    }
    await updateCompany(id, data)
    revalidate(id)
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to update company")
  }
}
