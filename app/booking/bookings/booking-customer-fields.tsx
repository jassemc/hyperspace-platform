"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { getListResources, getListMembers, getListCompanies } from "@/lib/service"
import type { CompanyDto, MemberDto, ResourceDto } from "@/lib/service/HsService"
import { ExtraTagPicker } from "@/components/extra-tag-picker"

type CustomerKind = "member" | "company"

interface BookingCustomerFieldsProps {
  /** SEED, not the whole list: when empty this component fetches
   *  `getListResources({ canBook: true })` itself, exactly as the old
   *  form did. Callers that already hold resources pass them to skip a
   *  request; the page-header button passes nothing. */
  resources?: ResourceDto[]
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
  resourceId,
  onResourceChange,
  prefillResourceName,
  disabled = false,
  onExtrasChange,
  initialExtraIds = [],
}: Readonly<BookingCustomerFieldsProps>) {
  const [resources, setResources] = useState<ResourceDto[]>(seedResources ?? [])
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({})
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  // Controlled so the tags know their own state; the picker posts the
  // selection as hidden `extraIds` inputs, which is what the action reads.
  const [extraIds, setExtraIds] = useState<string[]>(initialExtraIds)

  // The page-level Add button renders this form with no seed data, so
  // resources are fetched here rather than threaded through every caller.
  // Members and companies are fetched independently of that seed — the
  // create branch's Member/Company selects need them regardless of whether
  // resources happened to arrive pre-seeded, so seeding resources must not
  // silently starve the other two lookups — but they are still gated on
  // `disabled`, because in edit mode those selects are not rendered at all
  // and the two requests would be pure waste on every dialog open.
  useEffect(() => {
    let cancelled = false

    if ((seedResources ?? []).length === 0) {
      // A resource whose type cannot be booked would be refused by the
      // API, so it is never offered.
      getListResources({ limit: 100, offset: 0, sort: "ASC", canBook: true })
        .then((resourcePage) => {
          if (cancelled) return
          setResources((resourcePage.results ?? []) as ResourceDto[])
        })
        .catch((error) => console.error("Failed to load resources", error))
    }

    if (!disabled) {
      Promise.all([
        getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
        getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
      ])
        .then(([memberPage, companyPage]) => {
          if (cancelled) return
          setMemberNames(
            Object.fromEntries(
              ((memberPage.results ?? []) as MemberDto[]).map((m) => [m.id, m.fullName])
            )
          )
          setCompanyNames(
            Object.fromEntries(
              ((companyPage.results ?? []) as CompanyDto[]).map((c) => [c.id, c.name])
            )
          )
        })
        .catch((error) => console.error("Failed to load booking options", error))
    }

    return () => {
      cancelled = true
    }
  }, [seedResources, disabled])

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
    </>
  )
}
