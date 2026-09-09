"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateField } from "@/components/ui/date-field"
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
import { getListResourceTypes } from "@/lib/service"
import type { CreditTransactionDto, ResourceTypeDto } from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import { updateCreditAction } from "./actions"
import { toast } from "sonner"

interface EditCreditFormProps {
  isOpen: boolean
  onClose: () => void
  editingCredit?: CreditTransactionDto | null
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Updating..." : "Update"}
    </Button>
  )
}

/** Only the expiry, scope and reason are patchable — never the amount or type. */
export function EditCreditForm({ isOpen, onClose, editingCredit }: Readonly<EditCreditFormProps>) {
  const [state, formAction] = useActionState(updateCreditAction, {})
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeDto[]>([])
  const notifiedRef = useRef(false)
  // The calendar picker is controlled, so the value is reset per open.
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
    if (isOpen) setExpiresAt(editingCredit?.expiresAt?.slice(0, 10) ?? "")
  }, [isOpen, editingCredit])

  useEffect(() => {
    if (!isOpen) return
    notifiedRef.current = false

    let cancelled = false
    getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
      .then((response) => {
        if (cancelled) return
        setResourceTypes((response.results ?? []) as ResourceTypeDto[])
      })
      .catch((error) => console.error("Failed to load resource types", error))

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success("Credit updated")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, onClose])

  if (!editingCredit) return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[400px] ml-auto">
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
            <DrawerTitle>Edit Credit</DrawerTitle>
            <DrawerDescription>
              The amount and credit type are fixed; adjust when it lapses, what it covers and why.
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingCredit.id} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <input type="hidden" name="id" value={editingCredit.id} />
              <div className="space-y-6">
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {editingCredit.delta >= 0 ? "+" : ""}
                    {editingCredit.delta}
                  </span>{" "}
                  {editingCredit.creditType}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiresAt">Expires at</Label>
                  {/* In place, not portalled: inside the vaul drawer a portalled
                      calendar renders but eats every click. */}
                  <DateField
                    id="expiresAt"
                    name="expiresAt"
                    value={expiresAt}
                    onChange={setExpiresAt}
                    placeholder="Never lapses"
                    clearable
                    portalled={false}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank so it never lapses.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resourceTypeId">Limit to resource type</Label>
                  <select
                    id="resourceTypeId"
                    name="resourceTypeId"
                    className={selectClassName}
                    defaultValue={apiString(editingCredit.resourceTypeId) ?? ""}
                  >
                    <option value="">Any resource type</option>
                    {resourceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    name="reason"
                    defaultValue={apiString(editingCredit.reason) ?? ""}
                  />
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
