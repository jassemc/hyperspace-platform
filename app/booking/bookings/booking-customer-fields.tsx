"use client"

import { useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { getListResources, getListMembers, getListCompanies, getListDiscounts } from "@/lib/service"
import type { CompanyDto, DiscountDto, MemberDto, ResourceDto } from "@/lib/service/HsService"
import { ExtraTagPicker } from "@/components/extra-tag-picker"
import { formatDiscountValue, isInWindow } from "@/app/billing/discounts/discount-meta"

type CustomerKind = "member" | "company"

/** id → display name, the shape the selects iterate. */
function namesOf(rows: readonly { id: string; fullName: string }[] | readonly { id: string; name: string }[] | undefined) {
  return Object.fromEntries(
    (rows ?? []).map((row) => [row.id, "fullName" in row ? row.fullName : row.name])
  )
}

interface BookingCustomerFieldsProps {
  /** SEED, not the whole list: when empty this component fetches
   *  `getListResources({ canBook: true })` itself, exactly as the old
   *  form did. Callers that already hold resources pass them to skip a
   *  request; the page-header button passes nothing. */
  resources?: ResourceDto[]
  /** Same deal: seeded by the page, fetched here only when absent. */
  members?: MemberDto[]
  companies?: CompanyDto[]
  resourceId: string
  onResourceChange: (id: string) => void
  /** Read off the calendar payload so the select never flashes blank. */
  prefillResourceName?: string
  /** Edit mode: the API refuses a room change, so the select is frozen. */
  disabled?: boolean
  /** A quote describes one exact set of extras, so the dialog clears it. */
  onExtrasChange?: () => void
  /** Edit mode: the ids already on the booking, so the tags start selected. */
  initialExtraIds?: string[]
  /** A quote describes one exact discount too — same reasoning as extras. */
  onDiscountChange?: () => void
}

/**
 * Who the booking is for, and on what.
 *
 * The extras live here rather than in the dialog because they hang off the
 * *selected resource's* rates, and this is the component that owns the
 * resource list — the alternative was fetching that list twice. The customer
 * is create-only: PATCH /bookings cannot change it, so `disabled` hides the
 * Member/Company selects rather than showing them blank and inert. The
 * extras are editable in both modes — PATCH accepts `extraIds`.
 */
export function BookingCustomerFields({
  resources: seedResources,
  members: seedMembers,
  companies: seedCompanies,
  resourceId,
  onResourceChange,
  prefillResourceName,
  disabled = false,
  onExtrasChange,
  initialExtraIds = [],
  onDiscountChange,
}: Readonly<BookingCustomerFieldsProps>) {
  const [resources, setResources] = useState<ResourceDto[]>(seedResources ?? [])
  const [memberNames, setMemberNames] = useState<Record<string, string>>(() =>
    namesOf(seedMembers)
  )
  const [companyNames, setCompanyNames] = useState<Record<string, string>>(() =>
    namesOf(seedCompanies)
  )
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  // Controlled so the tags know their own state; the picker posts the
  // selection as hidden `extraIds` inputs, which is what the action reads.
  const [extraIds, setExtraIds] = useState<string[]>(initialExtraIds)
  // Create only (see the `!disabled` gate below): active resource-rate
  // discounts, fetched once. Filtered against the selected resource's
  // rates at render time rather than re-fetched per resource — the
  // catalog is small and shared across every room.
  const [discounts, setDiscounts] = useState<DiscountDto[]>([])
  const [discountId, setDiscountId] = useState("")

  // Every caller on the bookings page seeds all three lists from the
  // server (see lookups.ts), so nothing below runs there. The fetches stay
  // as a fallback for a caller that has no seed, keyed on whether the seed
  // EXISTS rather than on array identity: a server-component prop arrives
  // as a fresh array on every server re-render of the page, and an identity
  // dependency re-ran these on every filter change and revalidation.
  const hasResourceSeed = (seedResources ?? []).length > 0
  useEffect(() => {
    if (hasResourceSeed) return
    let cancelled = false
    // A resource whose type cannot be booked would be refused by the
    // API, so it is never offered.
    getListResources({ limit: 100, offset: 0, sort: "ASC", canBook: true })
      .then((resourcePage) => {
        if (cancelled) return
        setResources((resourcePage.results ?? []) as ResourceDto[])
      })
      .catch((error) => console.error("Failed to load resources", error))
    return () => {
      cancelled = true
    }
  }, [hasResourceSeed])

  // Gated on `disabled` too: in edit mode the Member/Company selects are
  // not rendered at all, and the two requests would be pure waste.
  const hasCustomerSeed = seedMembers !== undefined && seedCompanies !== undefined
  useEffect(() => {
    if (disabled || hasCustomerSeed) return
    let cancelled = false
    Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([memberPage, companyPage]) => {
        if (cancelled) return
        setMemberNames(namesOf(memberPage.results as MemberDto[] | undefined))
        setCompanyNames(namesOf(companyPage.results as CompanyDto[] | undefined))
      })
      .catch((error) => console.error("Failed to load booking options", error))
    return () => {
      cancelled = true
    }
  }, [disabled, hasCustomerSeed])

  // Create only: PATCH /bookings has no `discountId`, so edit mode never
  // fetches — the request would be pure waste, same reasoning as the
  // member/company fetch above.
  useEffect(() => {
    if (disabled) return
    let cancelled = false
    getListDiscounts({ limit: 100, offset: 0, sort: "ASC", kind: "resource_rate", status: "active" })
      .then((page) => {
        if (cancelled) return
        setDiscounts((page.results ?? []) as DiscountDto[])
      })
      .catch((error) => console.error("Failed to load discounts", error))
    return () => {
      cancelled = true
    }
  }, [disabled])

  // A discount picked for one room's rates means nothing on another —
  // reset rather than let a stale id ride along, silently narrowed to
  // whatever the new resource's eligible list happens to contain. Skips
  // the very first render: nothing has been quoted yet, so there is
  // nothing for `onDiscountChange` to invalidate.
  const isFirstResourceRender = useRef(true)
  useEffect(() => {
    if (isFirstResourceRender.current) {
      isFirstResourceRender.current = false
      return
    }
    setDiscountId("")
    onDiscountChange?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId])

  const selectedResource = resources.find((resource) => resource.id === resourceId)

  /**
   * The resource's extras, DEDUPED across its rates. Extras are many-to-many
   * with rates (`resource_rate_extras`), and a room normally carries several
   * rates — hourly, weekend, half-day, day, flat — with the same add-ons
   * attached to each. Flat-mapping them without deduping therefore yields one
   * row per rate: the seeded meeting room has five rates all offering
   * catering, so the list rendered "Catering" five times under the same
   * `key={extra.id}`, and checking two of them posted the same `extraIds`
   * twice. Keyed by id, so the last rate to mention an extra wins — they are
   * the same catalog row either way.
   */
  const availableExtras = [
    ...new Map(
      (selectedResource?.rates ?? [])
        .flatMap((rate) => rate.extras ?? [])
        .map((extra) => [extra.id, extra] as const)
    ).values(),
  ]
  // An extra that was booked but has since been detached from the room's
  // rates still needs a tag, or the user could never remove it — and the
  // API refuses the patch (`extra_not_offered`) while it is selected.
  const bookedButGone = initialExtraIds
    .filter((id) => !availableExtras.some((extra) => extra.id === id))
    .map((id) => ({ id, name: "No longer offered", priceHt: 0 }))
  const pickerExtras = [...availableExtras, ...bookedButGone]

  // A resource-rate discount fits this booking when it targets every rate
  // or names one of THIS resource's — the same rates the extras above are
  // deduped across — and is inside its validity window.
  const resourceRateIds = new Set((selectedResource?.rates ?? []).map((rate) => rate.id))
  const eligibleDiscounts = discounts.filter(
    (discount) =>
      isInWindow(discount) &&
      (discount.appliesToAll || discount.resourceRateIds.some((id) => resourceRateIds.has(id)))
  )

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="resourceId">Resource</Label>
        <NativeSelect
          id="resourceId"
          name="resourceId"
          value={resourceId}
          onChange={(e) => onResourceChange(e.target.value)}
          disabled={disabled}
          // A disabled <select> is out of the tab order, so the note below
          // is otherwise unreachable by keyboard or screen reader — the one
          // audience that cannot see it greyed out and infer why.
          aria-describedby={disabled ? "resourceId-frozen" : undefined}
          required
        >
          <option value="">Select resource</option>
          {/* The calendar payload already named this room; show it
              immediately instead of a blank value until the full
              resource list (fetched above) resolves. The only non-empty
              value the select can hold that is absent from that list is
              the prefilled one, so this never mislabels a later pick. */}
          {prefillResourceName &&
            resourceId &&
            !resources.some((resource) => resource.id === resourceId) && (
              <option value={resourceId}>{prefillResourceName}</option>
            )}
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </NativeSelect>
        {disabled && (
          <p id="resourceId-frozen" className="text-xs text-muted-foreground">
            Changing rooms is a cancel-and-rebook: the rate, the extras and the
            credits all hang off this one.
          </p>
        )}
      </div>

      {!disabled && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="customerKind">Customer type</Label>
            <NativeSelect
              id="customerKind"
              value={customerKind}
              onChange={(e) => setCustomerKind(e.target.value as CustomerKind)}
            >
              <option value="member">Member</option>
              <option value="company">Company</option>
            </NativeSelect>
          </div>

          {customerKind === "member" && (
            <div className="grid gap-2">
              <Label htmlFor="memberId">Member</Label>
              <NativeSelect id="memberId" name="memberId" required>
                <option value="">Select member</option>
                {Object.entries(memberNames).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          {customerKind === "company" && (
            <div className="grid gap-2">
              <Label htmlFor="companyId">Company</Label>
              <NativeSelect id="companyId" name="companyId" required>
                <option value="">Select company</option>
                {Object.entries(companyNames).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

        </>
      )}

      {pickerExtras.length > 0 && (
        <div className="grid gap-2">
          <Label>Extras</Label>
          {/* Tells updateBookingAction the picker was on screen, so an
              empty selection means "remove all" and not "field absent". */}
          <input type="hidden" name="extrasEdited" value="1" />
          <ExtraTagPicker
            extras={pickerExtras}
            value={extraIds}
            name="extraIds"
            onChange={(next) => {
              setExtraIds(next)
              onExtrasChange?.()
            }}
          />
          <p className="text-xs text-muted-foreground">
            {disabled
              ? "Extras you keep stay at the price they were booked at; ones you add are priced at today's rate."
              : "Offered by the rates attached to this resource."}
          </p>
        </div>
      )}

      {/* Create only: PATCH /bookings has no `discountId`, so edit mode
          keeps whatever discount confirm already applied. */}
      {!disabled && (
        <div className="grid gap-2">
          <Label htmlFor="discountId">Discount</Label>
          <NativeSelect
            id="discountId"
            name="discountId"
            value={discountId}
            onChange={(e) => {
              setDiscountId(e.target.value)
              onDiscountChange?.()
            }}
            disabled={!resourceId}
          >
            <option value="">{resourceId ? "No discount" : "Select a resource first"}</option>
            {eligibleDiscounts.map((discount) => (
              <option key={discount.id} value={discount.id}>
                {discount.code} — {formatDiscountValue(discount)}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
    </>
  )
}
