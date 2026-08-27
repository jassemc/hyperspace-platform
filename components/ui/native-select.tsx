"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A native <select> on Input's metrics.
 *
 * components/ui/ has no Radix Select, and this needs none: the options
 * here are short, static lists (times on a half-hour grid, a customer
 * kind, a resource). A native control also gets the platform's own
 * picker on touch, which is better than anything we would draw. The
 * class string this replaces was copy-pasted in three places.
 */
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          // Keep in step with components/ui/input.tsx.
          "border-input dark:bg-input/30 flex h-9 w-full min-w-0 appearance-none rounded-md border bg-transparent px-3 py-1 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
      />
    </div>
  )
}

export { NativeSelect }
