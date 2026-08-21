"use client"

import { useEffect, useActionState, useRef } from "react"
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
import type { PlanCategoryDto } from "@/lib/service/HsService"
import { createPlanCategoryAction, updatePlanCategoryAction } from "./actions"
import { toast } from "sonner"

interface AddPlanCategoryFormProps {
  isOpen: boolean
  onClose: () => void
  editingCategory?: PlanCategoryDto | null
}

function SubmitButton({ editingCategory }: Readonly<{ editingCategory?: PlanCategoryDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingCategory ? "Updating..." : "Creating..."
    return editingCategory ? "Update" : "Create Category"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddPlanCategoryForm({
  isOpen,
  onClose,
  editingCategory,
}: Readonly<AddPlanCategoryFormProps>) {
  const [createState, createFormAction] = useActionState(createPlanCategoryAction, {})
  const [updateState, updateFormAction] = useActionState(updatePlanCategoryAction, {})

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Plan category created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Plan category updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const currentState = editingCategory ? updateState : createState
  const formAction = editingCategory ? updateFormAction : createFormAction

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
            <DrawerTitle>
              {editingCategory ? "Edit Plan Category" : "Add New Plan Category"}
            </DrawerTitle>
            <DrawerDescription>
              Categories are the service sections the website groups plans under.
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingCategory?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Private offices"
                    defaultValue={editingCategory?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="private_offices"
                    defaultValue={editingCategory?.slug || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Stable machine identifier the website filters by. Derived from the name when
                    left blank.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Lockable offices for teams"
                    defaultValue={editingCategory?.description || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    step="1"
                    defaultValue={editingCategory?.sortOrder ?? 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ascending — lower numbers appear first on the website.
                  </p>
                </div>

                {editingCategory?.isDefault && (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    This is a shipped default. Renaming it is fine; the slug is what the website
                    filters by, so changing that can break existing links.
                  </div>
                )}

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingCategory={editingCategory} />
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
