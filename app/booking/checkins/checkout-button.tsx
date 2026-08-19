"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { checkOutAction } from "./actions"

interface CheckoutButtonProps {
  checkinId: string
  memberName: string
}

export function CheckoutButton({ checkinId, memberName }: Readonly<CheckoutButtonProps>) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const onCheckout = async () => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.set("id", checkinId)
      const result = await checkOutAction({}, formData)
      if (result.success) {
        toast.success(`${memberName} checked out`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to check out")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      title="Check out"
      disabled={pending}
      onClick={onCheckout}
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950 dark:border-orange-800"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Check out</span>
    </Button>
  )
}
