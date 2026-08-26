"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, Ban } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import type { PaymentMethod } from "@/lib/service/HsService"
import { recordPaymentAction, voidInvoiceAction } from "./actions"

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "virement", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "check", label: "Check" },
]

interface InvoiceActionButtonsProps {
  invoiceId: string
  // A draft invoice carries no number until it is issued.
  invoiceNumber: string | null
  outstanding: number
  canPay: boolean
  canVoid: boolean
}

export function InvoiceActionButtons({
  invoiceId,
  invoiceNumber,
  outstanding,
  canPay,
  canVoid,
}: Readonly<InvoiceActionButtonsProps>) {
  const label = invoiceNumber ?? "this draft invoice"
  const router = useRouter()
  const [pending, setPending] = useState<"pay" | "void" | null>(null)
  const [amount, setAmount] = useState(String(outstanding))
  const [method, setMethod] = useState<PaymentMethod>("virement")
  const [reference, setReference] = useState("")

  const submitPayment = async () => {
    setPending("pay")
    try {
      const formData = new FormData()
      formData.set("id", invoiceId)
      formData.set("amount", amount)
      formData.set("method", method)
      if (reference) formData.set("reference", reference)

      const result = await recordPaymentAction({}, formData)
      if (result.success) {
        toast.success(`Payment recorded on ${label}`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to record payment")
      }
    } finally {
      setPending(null)
    }
  }

  const submitVoid = async () => {
    setPending("void")
    try {
      const formData = new FormData()
      formData.set("id", invoiceId)
      const result = await voidInvoiceAction({}, formData)
      if (result.success) {
        toast.success(`${label} voided`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to void invoice")
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      {canPay && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Record a payment"
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 dark:border-green-800"
            >
              <Banknote className="h-4 w-4" />
              <span className="sr-only">Record payment</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Record a payment</AlertDialogTitle>
              <AlertDialogDescription>
                Against {label}. Partial payments are allowed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label htmlFor={`amount-${invoiceId}`}>Amount (TND)</Label>
                <Input
                  id={`amount-${invoiceId}`}
                  type="number"
                  min="0"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`method-${invoiceId}`}>Method</Label>
                <select
                  id={`method-${invoiceId}`}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`reference-${invoiceId}`}>Reference</Label>
                <Input
                  id={`reference-${invoiceId}`}
                  placeholder="Transfer or receipt number"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending !== null}>Cancel</AlertDialogCancel>
              <Button disabled={pending !== null || !amount} onClick={submitPayment}>
                {pending === "pay" ? "Recording..." : "Record payment"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Voiding is irreversible, so it always confirms first. */}
      {canVoid && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Void invoice"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
            >
              <Ban className="h-4 w-4" />
              <span className="sr-only">Void</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Void {label}?</AlertDialogTitle>
              <AlertDialogDescription>
                Voiding cannot be undone. The charges on it return to uninvoiced.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending !== null}>Keep it</AlertDialogCancel>
              <Button variant="destructive" disabled={pending !== null} onClick={submitVoid}>
                {pending === "void" ? "Voiding..." : "Void invoice"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
