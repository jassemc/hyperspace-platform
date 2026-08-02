"use client"

import { useEffect, useState, useTransition } from "react"
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
import { UserPlus, X } from "lucide-react"
import type { MemberDto } from "@/lib/service/HsService"
import { attachMemberAction, searchAttachableMembers } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AttachMemberButton({ companyId }: Readonly<{ companyId: string }>) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [candidates, setCandidates] = useState<MemberDto[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [isLoading, startLoading] = useTransition()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      startLoading(async () => {
        const results = await searchAttachableMembers(query)
        setCandidates(results)
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [isOpen, query])

  const handleClose = () => {
    setIsOpen(false)
    setQuery("")
    setSelectedId("")
    setCandidates([])
  }

  const onSubmit = async () => {
    if (!selectedId) {
      toast.error("Select a member to attach")
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("companyId", companyId)
      formData.append("memberId", selectedId)
      const result = await attachMemberAction({}, formData)

      if (result.success) {
        toast.success("Member attached")
        handleClose()
        router.refresh()
      } else {
        toast.error(result.error || "Failed to attach member")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const getEmptyStateText = () => {
    if (isLoading) return "Searching..."
    return query
      ? "No unaffiliated member matches this search."
      : "Every member already belongs to a company."
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Attach Member
      </Button>

      <Drawer open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())} direction="right">
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
              <DrawerTitle>Attach Member</DrawerTitle>
              <DrawerDescription>
                Only members without an employer are listed. Attaching sets this company as their
                employer.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="grid gap-2">
                <Label htmlFor="member-search">Search</Label>
                <Input
                  id="member-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, email or phone"
                />
              </div>

              <div className="mt-4 grid gap-2">
                {candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{getEmptyStateText()}</p>
                ) : (
                  candidates.map((member) => {
                    const isSelected = selectedId === member.id
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedId(member.id)}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-muted/50"
                        }`}
                      >
                        <span className="block font-medium">{member.fullName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {member.email || member.phone || "No contact details"}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <DrawerFooter className="border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <Button onClick={onSubmit} disabled={isSaving || !selectedId} className="flex-1">
                  {isSaving ? "Attaching..." : "Attach"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
