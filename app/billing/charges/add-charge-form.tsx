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
import { getListMembers, getListCompanies } from "@/lib/service"
import type { CompanyDto, MemberDto } from "@/lib/service/HsService"
import { formatEnumLabel } from "@/lib/format"
import { createChargeAction } from "./actions"
import { CREATABLE_CHARGE_KINDS } from "./charge-meta"
import { toast } from "sonner"

interface AddChargeFormProps {
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
      {pending ? "Creating..." : "Create Charge"}
    </Button>
  )
}

export function AddChargeForm({ isOpen, onClose }: Readonly<AddChargeFormProps>) {
  const [state, formAction] = useActionState(createChargeAction, {})
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  const [members, setMembers] = useState<MemberDto[]>([])
  const [companies, setCompanies] = useState<CompanyDto[]>([])
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    notifiedRef.current = false

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
      .catch((error) => console.error("Failed to load charge options", error))

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success("Charge created")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, onClose])

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[420px] ml-auto">
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
            <DrawerTitle>Add New Charge</DrawerTitle>
            <DrawerDescription>
              A billable line. It stays uninvoiced until it is put on an invoice.
            </DrawerDescription>
          </DrawerHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="kind">Kind</Label>
                  <select id="kind" name="kind" className={selectClassName} defaultValue="one_off" required>
                    {CREATABLE_CHARGE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {formatEnumLabel(kind)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Plan fees, booking charges and deposits are raised automatically.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customerKind">Charge to</Label>
                  <select
                    id="customerKind"
                    className={selectClassName}
                    value={customerKind}
                    onChange={(e) => setCustomerKind(e.target.value as CustomerKind)}
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
                    required
                  >
                    <option value="">Select {customerKind}</option>
                    {customerKind === "member"
                      ? members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))
                      : companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Meeting room — March" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amountHt">Amount excl. VAT (TND)</Label>
                  <Input id="amountHt" name="amountHt" type="number" min="0" step="0.001" defaultValue={0} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="vatRate">VAT rate (%)</Label>
                  <Input id="vatRate" name="vatRate" type="number" min="0" step="0.5" defaultValue={19} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accountingCode">Accounting code</Label>
                  <Input id="accountingCode" name="accountingCode" placeholder="706100" />
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
