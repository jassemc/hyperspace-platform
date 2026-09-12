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
import type { MembershipQuoteDto, OpportunityDto } from "@/lib/service/HsService"
import { apiNumber } from "@/lib/api-value"
import { formatPriceHt, todayInTunis } from "@/lib/format"
import { onboardLeadAction, quoteOnboardingAction } from "./actions"
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

type CodeMode = "keep" | "offer" | "drop" | "replace"

/** A typed code is re-quoted once the typing pauses, not on every key. */
const QUOTE_DEBOUNCE_MS = 300

function SubmitButton({ disabled }: Readonly<{ disabled: boolean }>) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} className="flex-1">
      {pending ? "Converting..." : "Convert to membership"}
    </Button>
  )
}

function Row({
  label,
  children,
  muted,
  total,
}: Readonly<{ label: React.ReactNode; children: React.ReactNode; muted?: boolean; total?: boolean }>) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${total ? "border-t mt-1 pt-2" : ""}`}>
      <span className={`text-xs ${total ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm text-right tabular-nums ${muted ? "text-muted-foreground" : ""} ${total ? "font-medium" : ""}`}>
        {children}
      </span>
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
  // The visitor's own code and the public offer live when the website
  // quoted the lead arrive separately (backend #51); staff pick which one
  // the membership gets. The visitor's code wins by default when both are
  // there — a partner code is the rarer, more deliberate signal.
  const visitorCode = opportunity.requestedDiscountCode ?? null
  const offerCode = opportunity.publicOfferCode ?? null
  const [codeMode, setCodeMode] = useState<CodeMode>(
    visitorCode ? "keep" : offerCode ? "offer" : "replace"
  )
  const [typedCode, setTypedCode] = useState("")
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
  // The LIST plan fee — what the quote below starts from. Add-ons bill as
  // their own rows every cycle.
  const listPlanFee =
    apiNumber(opportunity.requestedPlanPriceHt) ??
    opportunity.requestedPlan?.priceHt ??
    plan?.priceHt ??
    null

  // Without a plan there is nothing to bill, and the API refuses the request.
  const blocked = !opportunity.requestedPlan

  // The code the conversion will be sent, as the radios and the input
  // stand right now — the same keep / offer / drop / replace the action
  // derives, so the preview prices what the submit would.
  const chosenCode =
    codeMode === "keep"
      ? visitorCode
      : codeMode === "offer"
        ? offerCode
        : codeMode === "replace"
          ? typedCode.trim() || null
          : null

  // The preview is the API's own quote (backend #56): the exact lines the
  // conversion will write, so the number staff approve is the number the
  // member will owe. Re-asked whenever the code decision or the first
  // day changes; the drawer used to show the list fee regardless of the
  // code it was about to apply, and Remove / Replace visibly did nothing.
  const [quote, setQuote] = useState<MembershipQuoteDto | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)
  useEffect(() => {
    if (blocked || !isOpen) return
    let cancelled = false
    setQuoting(true)
    const timer = setTimeout(() => {
      quoteOnboardingAction({
        opportunityId: opportunity.id,
        startsAt,
        discountCode: chosenCode,
      })
        .then((result) => {
          if (cancelled) return
          if (result.quote) {
            setQuote(result.quote)
            setQuoteError(null)
          } else {
            // Keep the last good quote on screen, greyed, with the reason
            // this code cannot be applied — the same refusal the
            // conversion would give.
            setQuoteError(result.error ?? "Could not price this conversion")
          }
        })
        .finally(() => {
          if (!cancelled) setQuoting(false)
        })
    }, QUOTE_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [blocked, isOpen, opportunity.id, startsAt, chosenCode])

  // What the "What they will pay" block shows: the quote when it matches
  // the current code, the list figures until the first one arrives.
  const stale = quoteError !== null || quoting
  const planFeeLines = quote?.lines.filter((line) => line.kind === "plan_fee") ?? []
  const quotedPlanFee = planFeeLines[0]?.amountHt ?? listPlanFee
  const quotedExtras = planFeeLines.slice(1)
  const depositLines = quote?.lines.filter((line) => line.kind === "deposit") ?? []
  const depositNote = depositLines.some((line) => line.description.includes("does not apply to deposits"))

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

                <section className="rounded-md border p-4" aria-busy={quoting}>
                  <div className="flex items-baseline justify-between pb-2">
                    <p className="text-xs font-medium">What they will pay</p>
                    {quoting && <span className="text-xs text-muted-foreground">Pricing…</span>}
                  </div>
                  <Row label="Plan fee (list)" muted={stale}>
                    {formatPriceHt(quotedPlanFee)}
                  </Row>
                  {quote
                    ? quotedExtras.map((line, index) => (
                        <Row key={line.description} label={extras[index]?.name ?? "Extra"} muted={stale}>
                          {formatPriceHt(line.amountHt)}
                        </Row>
                      ))
                    : extras.map((extra) => (
                        <Row key={extra.extraId} label={extra.name} muted>
                          {formatPriceHt(extra.priceHt)}
                        </Row>
                      ))}
                  {quote?.discount && (
                    <Row
                      label={
                        <>
                          Discount{" "}
                          <code className="rounded bg-muted px-1">{quote.discount.code}</code>
                        </>
                      }
                      muted={stale}
                    >
                      {formatPriceHt(quote.cycleDiscountHt)}
                    </Row>
                  )}
                  <Row label="First cycle (HT)" total muted={stale}>
                    {quote
                      ? formatPriceHt(quote.cycleNetHt)
                      : formatPriceHt(listPlanFee === null ? null : listPlanFee + extrasTotal)}
                  </Row>
                  {quote && quote.depositHt > 0 && (
                    <Row
                      label={depositNote ? "Deposit — not discounted" : "Deposit"}
                      muted={stale}
                    >
                      {formatPriceHt(quote.depositHt)}
                    </Row>
                  )}
                  {quote && quote.setupFeeHt > 0 && (
                    <Row label="Setup fee" muted={stale}>
                      {formatPriceHt(quote.setupFeeHt)}
                    </Row>
                  )}
                  {quote && (quote.depositHt > 0 || quote.setupFeeHt > 0) && (
                    <Row label="Due at creation (HT)" total muted={stale}>
                      {formatPriceHt(quote.dueAtCreationHt)}
                    </Row>
                  )}
                  {quoteError ? (
                    <p className="pt-2 text-xs text-red-600">{quoteError}</p>
                  ) : (
                    <p className="pt-2 text-xs text-muted-foreground">
                      {quote
                        ? "These are the charges the conversion will write; they follow the code you pick below."
                        : "List prices — the priced quote is on its way."}
                    </p>
                  )}
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
                  {visitorCode || offerCode ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      {visitorCode && (
                        <p>
                          Requested on the website:{" "}
                          <code className="rounded bg-muted px-1">{visitorCode}</code>
                        </p>
                      )}
                      {offerCode && (
                        <p className={visitorCode ? "mt-1" : undefined}>
                          Public offer shown to the visitor:{" "}
                          <code className="rounded bg-muted px-1">{offerCode}</code>
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4">
                        {visitorCode && (
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="codeMode"
                              value="keep"
                              checked={codeMode === "keep"}
                              onChange={() => setCodeMode("keep")}
                            />{" "}
                            Keep {offerCode ? "the visitor's code" : ""}
                          </label>
                        )}
                        {offerCode && (
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="codeMode"
                              value="offer"
                              checked={codeMode === "offer"}
                              onChange={() => setCodeMode("offer")}
                            />{" "}
                            Apply the public offer
                          </label>
                        )}
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
                  {(codeMode === "replace" || (!visitorCode && !offerCode)) && (
                    <Input
                      name="discountCodeInput"
                      placeholder="e.g. 10LOYALTY"
                      value={typedCode}
                      onChange={(e) => setTypedCode(e.target.value.toUpperCase())}
                    />
                  )}
                  <input
                    type="hidden"
                    name="discountCode"
                    value={
                      codeMode === "keep"
                        ? visitorCode ?? ""
                        : codeMode === "offer"
                          ? offerCode ?? ""
                          : ""
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Priced above as you change it; an unknown or ineligible code
                    is refused with the reason, here and at conversion.
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
