"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

/**
 * The API exposes no PDF endpoint, so printing goes through the browser. "Save
 * as PDF" in the print dialog is how a PDF copy is produced.
 */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Print / Save as PDF
    </Button>
  )
}
