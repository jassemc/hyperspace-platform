"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateField } from "@/components/ui/date-field"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { X } from "lucide-react"
import type { OpportunityDto } from "@/lib/service/HsService"
import { apiNumber } from "@/lib/api-value"
import { formatPriceHt, todayInTunis } from "@/lib/format"
import { onboardLeadAction } from "./actions"
import { benefitLabel } from "@/lib/benefits"
import {
  OPPORTUNITY_INTEREST_LABELS,
} from "./opportunity-meta"
import type { ConvertContext } from "./use-opportunity-options"
import { toast } from "sonner"

interface ConvertLeadFormProps {
  isOpen: boolean
  onClose: () => void
  context: ConvertContext
  opportunity: OpportunityDto
}

function SubmitButton({ disabled }: Readonly<{ disabled: boolean }>) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} className="flex-1">
      {pending ? "Converting..." : "Convert to membership"}
    </Button>
  )
}

function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  )
}

export function ConvertLeadForm({
  isOpen,
  onClose,
  context,
  opportunity,
}: Readonly<ConvertLeadFormProps>) {
  const [state, formAction] = useActionState(onboardLeadAction, {})
  const [startsAt, setStartsAt] = useState(todayInTunis())
  const [endsAt, setEndsAt] = useState("")
  const [codeMode, setCodeMode] = useState<"keep" | "drop" | "replace">(
    opportunity.requestedDiscountCode ? "keep" : "replace"
  )
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success(state.message ?? "Lead converted")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, state.message, onClose])

  // Named by the row itself; only the plan's benefits needed fetching.
  const plan = context.plan
  const resource = opportunity.requestedResource ?? null
  const member = opportunity.member

  const extras = opportunity.requestedExtras ?? []
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.priceHt, 0)
  // The plan fee alone; add-ons bill as their own rows every cycle.
  const planFee =
    apiNumber(opportunity.requestedPlanPriceHt) ??
    opportunity.requestedPlan?.priceHt ??
    plan?.priceHt ??
    null

  // Without a plan there is nothing to bill, and the API refuses the request.
  const blocked = !opportunity.requestedPlan

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[460px] ml-auto">
        <div className="flex h-full flex-col">
          <div className="flex justify-end p-4 pb-0">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>

          <DrawerHeader className="px-6 pb-4">
            <DrawerTitle>Convert this lead</DrawerTitle>
            <DrawerDescription>
              Creates the membership, its credits and charges, holds the space,
              and marks the opportunity won — in one step.
            </DrawerDescription>
          </DrawerHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="opportunityId" value={opportunity.id} />

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
                <section className="rounded-md border p-4">
                  <p className="text-xs font-medium pb-2">What was sold</p>
                  <Row label="Member">{member?.fullName ?? "Unknown"}</Row>
                  <Row label="Interest">
                    {OPPORTUNITY_INTEREST_LABELS[opportunity.interest] ?? opportunity.interest}
                  </Row>
                  <Row label="Plan">
                    {opportunity.requestedPlan?.name ?? (
                      <span className="text-red-600">None recorded</span>
                    )}
                  </Row>
                  <Row label="Plan fee">{formatPriceHt(planFee)}</Row>
                  <Row label="Space">
                    {resource ? (
                      resource.name
                    ) : (
                      <span className="text-muted-foreground">Assign later</span>
                    )}
                  </Row>
                </section>

                {plan && plan.benefits.length > 0 && (
                  <section className="rounded-md border bg-muted/40 p-4">
                    <p className="text-xs font-medium">Included with this plan</p>
                    <ul className="pt-2 space-y-1">
                      {plan.benefits.map((benefit) => (
                        <li key={benefit.id} className="text-xs text-muted-foreground">
                          {benefitLabel(benefit)}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="rounded-md border p-4">
                  <p className="text-xs font-medium pb-2">Paid add-ons</p>
                  {extras.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None.</p>
                  ) : (
                    <>
                      {extras.map((extra) => (
                        <Row key={extra.extraId} label={extra.name}>
                          {formatPriceHt(extra.priceHt)}
                        </Row>
                      ))}
                      <div className="border-t mt-2 pt-2">
                        <Row label="Add-ons total">{formatPriceHt(extrasTotal)}</Row>
                      </div>
                    </>
                  )}
                  <p className="pt-2 text-xs text-muted-foreground">
                    Billed as their own rows each cycle, on top of the plan fee.
                  </p>
                </section>

                {blocked ? (
                  <p className="text-sm text-red-600">
                    This lead has no requested plan, so there is nothing to bill.
                    Add one from Edit, then convert.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Something here is wrong? Close this and edit the opportunity —
                    it is the only word on what gets sold.
                  </p>
                )}

                <div className="grid gap-2">
                  <Label>Discount code</Label>
                  {opportunity.requestedDiscountCode ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      Requested on the website:{" "}
                      <code className="rounded bg-muted px-1">
                        {opportunity.requestedDiscountCode}
                      </code>
                      <div className="mt-2 flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="codeMode"
                            value="keep"
                            checked={codeMode === "keep"}
                            onChange={() => setCodeMode("keep")}
                          />{" "}
                          Keep
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="codeMode"
                            value="drop"
                            checked={codeMode === "drop"}
                            onChange={() => setCodeMode("drop")}
                          />{" "}
                          Remove
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="codeMode"
                            value="replace"
                            checked={codeMode === "replace"}
                            onChange={() => setCodeMode("replace")}
                          />{" "}
                          Replace
                        </label>
                      </div>
                    </div>
                  ) : (
                    // No radios rendered, so nothing else would submit a
                    // codeMode — the action falls back to "replace" without
                    // this, but the typed code would be silently dropped.
                    <input type="hidden" name="codeMode" value="replace" />
                  )}
                  {(codeMode === "replace" || !opportunity.requestedDiscountCode) && (
                    <Input
                      name="discountCodeInput"
                      placeholder="e.g. 10LOYALTY"
                      onChange={(e) => {
                        e.currentTarget.value = e.currentTarget.value.toUpperCase()
                      }}
                    />
                  )}
                  <input
                    type="hidden"
                    name="discountCode"
                    value={codeMode === "keep" ? opportunity.requestedDiscountCode ?? "" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Checked when the membership is created; an unknown or ineligible code
                    is refused with the reason.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startsAt">First day of the membership</Label>
                  <DateField
                    id="startsAt"
                    name="startsAt"
                    value={startsAt}
                    onChange={setStartsAt}
                    required
                    // In place, not portalled: the vaul drawer's modal
                    // mode makes the body pointer-inert, so a portalled
                    // calendar rendered but ate every click — these
                    // fields read as "not editable".
                    portalled={false}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Last day (optional)</Label>
                  <DateField
                    id="endsAt"
                    name="endsAt"
                    value={endsAt}
                    onChange={setEndsAt}
                    min={startsAt}
                    placeholder="Open-ended"
                    clearable
                    portalled={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for an open-ended membership. Dates cannot be
                    changed afterwards.
                  </p>
                </div>

                {state.error && <div className="text-sm text-red-600">{state.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton disabled={blocked} />
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
