"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPriceHt } from "@/lib/format"

export interface ExtraTagOption {
  id: string
  name: string
  priceHt: number
}

interface ExtraTagPickerProps {
  extras: ExtraTagOption[]
  value: string[]
  onChange: (next: string[]) => void
  /**
   * When set, one hidden input per selected extra is rendered under this
   * name, so a server action can keep reading `formData.getAll(name)`.
   */
  name?: string
  disabled?: boolean
}

/**
 * Add-ons as toggleable tags rather than a checkbox list: a row of pills
 * reads at a glance and takes a third of the height. Each pill is a real
 * checkbox to assistive tech (role + aria-checked) and toggles on click,
 * Space or Enter like the native control it replaces.
 */
export function ExtraTagPicker({
  extras,
  value,
  onChange,
  name,
  disabled = false,
}: Readonly<ExtraTagPickerProps>) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div className="flex flex-wrap gap-2">
      {extras.map((extra) => {
        const selected = value.includes(extra.id)
        return (
          <button
            key={extra.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => toggle(extra.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
            <span>{extra.name}</span>
            <span className={cn("text-xs", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
              +{formatPriceHt(extra.priceHt)}
            </span>
          </button>
        )
      })}
      {/* Only ids the current list offers: a selection made under a previous
          resource must not be posted once that resource is swapped out. */}
      {name &&
        extras
          .filter((extra) => value.includes(extra.id))
          .map((extra) => <input key={extra.id} type="hidden" name={name} value={extra.id} />)}
    </div>
  )
}
