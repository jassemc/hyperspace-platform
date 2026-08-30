"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { getListCharges, getListMembers, getListCompanies } from "@/lib/service"
import type { ChargeDto, CompanyDto, MemberDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { createInvoiceAction } from "./actions"
import { toast } from "sonner"

interface AddInvoiceFormProps {
  /** Opened from a member's page: the customer starts on them, charges included. */
  defaultMemberId?: string
  /** Opened from a company's page: bill-to starts on the company. */
  defaultCompanyId?: string
  isOpen: boolean
  onClose: () => void
}

type CustomerKind = "member" | "company"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Creating..." : "Create Invoice"}
    </Button>
  )
}

export function AddInvoiceForm({
  isOpen,
  onClose,
  defaultMemberId,
  defaultCompanyId,
}: Readonly<AddInvoiceFormProps>) {
  const [state, formAction] = useActionState(createInvoiceAction, {})
  const [customerKind, setCustomerKind] = useState<CustomerKind>(
    defaultCompanyId ? "company" : "member"
  )
  const [customerId, setCustomerId] = useState(defaultCompanyId ?? defaultMemberId ?? "")
  const [members, setMembers] = useState<MemberDto[]>([])
  const [companies, setCompanies] = useState<CompanyDto[]>([])
  const [charges, setCharges] = useState<ChargeDto[]>([])
  const [isLoadingCharges, setIsLoadingCharges] = useState(false)
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([])

  const notifiedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      setCharges([])
      setSelectedChargeIds([])
      setCustomerId("")
      return
    }

    notifiedRef.current = false
    setCustomerId(defaultCompanyId ?? defaultMemberId ?? "")
    let cancelled = false

    Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([memberPage, companyPage]) => {
        if (cancelled) return
        setMembers((memberPage.results ?? []) as MemberDto[])
        setCompanies((companyPage.results ?? []) as CompanyDto[])
      })
      .catch((error) => console.error("Failed to load invoice options", error))

    return () => {
      cancelled = true
    }
  }, [isOpen, defaultMemberId, defaultCompanyId])

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success("Invoice created")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, onClose])

  /**
   * An invoice bills charges that are not yet on one, so the picker is scoped to
   * the chosen customer's uninvoiced charges.
   */
  useEffect(() => {
    if (!isOpen || !customerId) {
      setCharges([])
      setSelectedChargeIds([])
      return
    }

    let cancelled = false
    setIsLoadingCharges(true)
    getListCharges({
      limit: 100,
      offset: 0,
      sort: "ASC",
      uninvoiced: true,
      memberId: customerKind === "member" ? customerId : undefined,
      companyId: customerKind === "company" ? customerId : undefined,
    })
      .then((response) => {
        if (cancelled) return
        setCharges((response.results ?? []) as ChargeDto[])
        setSelectedChargeIds([])
      })
      .catch((error) => console.error("Failed to load uninvoiced charges", error))
      .finally(() => {
        if (!cancelled) setIsLoadingCharges(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, customerId, customerKind])

  const toggleCharge = (id: string) => {
    setSelectedChargeIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    )
  }

  const selectedTotal = charges
    .filter((charge) => selectedChargeIds.includes(charge.id))
    .reduce((sum, charge) => sum + charge.amountHt, 0)

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[440px] ml-auto">
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
            <DrawerTitle>Add New Invoice</DrawerTitle>
            <DrawerDescription>
              Group uninvoiced charges for one customer into an invoice.
            </DrawerDescription>
          </DrawerHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="customerKind">Bill to</Label>
                  <select
                    id="customerKind"
                    className={selectClassName}
                    value={customerKind}
                    onChange={(e) => {
                      setCustomerKind(e.target.value as CustomerKind)
                      setCustomerId("")
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customerId">
                    {customerKind === "member" ? "Member" : "Company"}
                  </Label>
                  <select
                    id="customerId"
                    name={customerKind === "member" ? "memberId" : "companyId"}
                    className={selectClassName}
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Select {customerKind}</option>
                    {(customerKind === "member" ? members : companies).map((option) => (
                      <option key={option.id} value={option.id}>
                        {"fullName" in option ? option.fullName : option.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Charges</Label>
                  {(() => {
                    if (!customerId) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Pick a customer to list their uninvoiced charges.
                        </p>
                      )
                    }
                    if (isLoadingCharges) {
                      return <p className="text-sm text-muted-foreground">Loading charges...</p>
                    }
                    if (charges.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          No uninvoiced charges for this customer.
                        </p>
                      )
                    }
                    return (
                      <div className="grid gap-2 rounded-md border border-input p-3">
                        {charges.map((charge) => (
                          <label key={charge.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="chargeIds"
                              value={charge.id}
                              checked={selectedChargeIds.includes(charge.id)}
                              onChange={() => toggleCharge(charge.id)}
                              className="mt-0.5 h-4 w-4 rounded border-input"
                            />
                            <span>
                              {charge.description}
                              <span className="block text-xs text-muted-foreground">
                                {formatPriceHt(charge.amountHt)} HT
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )
                  })()}
                  {selectedChargeIds.length > 0 && (
                    <p className="text-sm">
                      {selectedChargeIds.length} selected — {formatPriceHt(selectedTotal)} HT
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueAt">Due date</Label>
                  <Input id="dueAt" name="dueAt" type="date" />
                </div>

                {state.error && <div className="text-sm text-red-600">{state.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton />
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
