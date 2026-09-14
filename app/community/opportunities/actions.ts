"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { problem } from "@/lib/action-state"
import { createOpportunity, onboardLead, quoteOnboarding, updateOpportunity } from "@/lib/service"
import type {
  CreateOpportunityDto,
  MembershipQuoteDto,
  OnboardingQuoteDto,
  OnboardingResultDto,
  OpportunityInterest,
  OpportunityStage,
  RequestedExtraDto,
  UpdateOpportunityDto,
} from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
  /** Success detail worth showing, when "done" alone is too thin. */
  message?: string
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

/**
 * An update distinguishes "leave it" from "empty it": a field the form never
 * carried is undefined and stays untouched, while one the user cleared is null
 * and is wiped. Without this an emptied box silently kept its old value.
 */
function clearable<T>(formData: FormData, field: string, value: T | undefined) {
  if (value !== undefined) return value
  return formData.has(field) ? null : undefined
}

/**
 * The drawer posts the chosen add-ons as a JSON snapshot (id, name, price,
 * VAT) because the opportunity stores them by value, the way a website plan
 * request does. Absent = leave whatever the opportunity already carries.
 */
/** Open opportunities feed member status, so both tags move together. */
function revalidate() {
  revalidatePath("/community/opportunities")
  revalidateTag("stats:opportunities")
  revalidateTag("stats:members")
}

function requestedExtras(formData: FormData): RequestedExtraDto[] | undefined {
  const raw = text(formData, "requestedExtras")
  if (raw === undefined) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RequestedExtraDto[]) : undefined
  } catch {
    return undefined
  }
}

function opportunityFields(formData: FormData) {
  return {
    memberId: text(formData, "memberId"),
    interest: text(formData, "interest") as OpportunityInterest | undefined,
    stage: text(formData, "stage") as OpportunityStage | undefined,
    expectedValue: clearable(formData, "expectedValue", num(formData, "expectedValue")),
    source: clearable(formData, "source", text(formData, "source")),
    notes: clearable(formData, "notes", text(formData, "notes")),
    requestedPlanId: clearable(
      formData,
      "requestedPlanId",
      text(formData, "requestedPlanId")
    ),
    requestedResourceId: clearable(
      formData,
      "requestedResourceId",
      text(formData, "requestedResourceId")
    ),
    requestedPlanPriceHt: clearable(
      formData,
      "requestedPlanPriceHt",
      num(formData, "requestedPlanPriceHt")
    ),
    requestedExtras: requestedExtras(formData),
    requestedDiscountCode: clearable(
      formData,
      "requestedDiscountCode",
      text(formData, "requestedDiscountCode")
    ),
    requestedDate: clearable(formData, "requestedDate", text(formData, "requestedDate")),
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
      // Nothing to clear on a lead that does not exist yet.
      expectedValue: fields.expectedValue ?? undefined,
      source: fields.source ?? undefined,
      notes: fields.notes ?? undefined,
      requestedPlanId: fields.requestedPlanId ?? undefined,
      requestedResourceId: fields.requestedResourceId ?? undefined,
      requestedPlanPriceHt: fields.requestedPlanPriceHt ?? undefined,
      requestedDiscountCode: fields.requestedDiscountCode ?? undefined,
      requestedDate: fields.requestedDate ?? undefined,
      memberId: fields.memberId,
      interest: fields.interest,
      // Required by the schema; an opportunity always carries a list.
      requestedExtras: fields.requestedExtras ?? [],
    }

    await createOpportunity(data)
    revalidate()
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
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update opportunity",
    }
  }
}

/**
 * Converts the lead: the opportunity says what was sold, this says when it
 * starts. Anything else about the deal is changed by updating the opportunity
 * first — the endpoint refuses fields that would contradict it.
 */
export async function onboardLeadAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const opportunityId = text(formData, "opportunityId")
    const startsAt = text(formData, "startsAt")
    // The form always submits a codeMode when a code was requested (a
    // hidden field covers the no-request case too); "replace" is only a
    // fallback for a request that predates that field, or bypasses the form.
    const codeMode = text(formData, "codeMode") ?? "replace"

    if (!opportunityId) return { success: false, error: "Opportunity is required" }
    if (!startsAt) return { success: false, error: "Start date is required" }

    // keep = the visitor's requested code, verbatim; offer = the public
    // offer live when the website quoted the lead (backend #51 — both
    // travel in the hidden discountCode field); replace = what staff
    // typed; drop = explicitly null, clearing it rather than leaving it
    // unset.
    let discountCode: string | null | undefined
    if (codeMode === "keep" || codeMode === "offer")
      discountCode = text(formData, "discountCode")
    else if (codeMode === "replace") discountCode = text(formData, "discountCodeInput")
    else if (codeMode === "drop") discountCode = null

    // #91 (R-09): the dialog's own copy promised the space was held,
    // but nothing assigned it — staff had to open the membership row
    // afterwards, and meanwhile the office read as free on the public
    // catalogue and could be requested by someone else.
    //
    // POST /onboarding assigns from day one when the OPPORTUNITY names a
    // space; it takes no resource of its own ("to change what is sold,
    // PATCH the opportunity first"). So the drawer's picker writes the
    // choice onto the opportunity first, and the conversion then holds
    // it in its own transaction — which is what the copy always claimed.
    const requestedResourceId = text(formData, "requestedResourceId")
    const previousResourceId = text(formData, "previousResourceId")
    if ((requestedResourceId ?? "") !== (previousResourceId ?? "")) {
      await updateOpportunity(opportunityId, {
        requestedResourceId: requestedResourceId ?? null,
      })
    }

    const result = (await onboardLead({
      opportunityId,
      startsAt,
      endsAt: text(formData, "endsAt"),
      discountCode,
    })) as OnboardingResultDto

    revalidate()
    revalidatePath("/community/memberships")
    revalidatePath("/space/resources")
    // Onboarding turns the lead into a membership, moving company figures too.
    revalidateTag("stats:memberships")
    revalidateTag("stats:companies")

    return {
      success: true,
      message: result?.assignment
        ? "Membership created and the space assigned"
        : "Membership created — assign a space when one is chosen",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert this lead",
    }
  }
}

/**
 * The convert drawer's live preview (backend #56): what converting this
 * lead would charge, with the code as the drawer currently has it. A
 * refusal (unknown or ineligible code, closed lead) comes back as text,
 * not a thrown error — a thrown server-action error reaches the browser
 * stripped of its message in production, and the reason is the point.
 */
export async function quoteOnboardingAction(
  input: OnboardingQuoteDto
): Promise<{ quote?: MembershipQuoteDto; error?: string }> {
  try {
    return { quote: (await quoteOnboarding(input)) as MembershipQuoteDto }
  } catch (error) {
    // The bare RFC 9457 detail ("Discount code "X" does not exist"), not
    // the client's "Status Code 422: …" message.
    return { error: problem(error, "Could not price this conversion").error }
  }
}
