/**
 * Mirror of the backend's discount-math.util (spec §4) for previews only —
 * the server figure is authoritative. Percent → every line; amount off →
 * the main line only, clamped at that line's amount.
 */
export interface DiscountValue {
  percentOff?: number | null
  amountOffHt?: number | null
}
export interface DiscountLine {
  key: string
  amountHt: number
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

export function applyDiscount(
  d: DiscountValue,
  lines: DiscountLine[],
  mainKey: string
): { key: string; discountHt: number }[] {
  if (d.percentOff !== null && d.percentOff !== undefined) {
    return lines
      .map((l) => ({ key: l.key, discountHt: -round3((l.amountHt * d.percentOff!) / 100) }))
      .filter((l) => l.discountHt !== 0)
  }
  const main = lines.find((l) => l.key === mainKey)
  if (!main || d.amountOffHt === null || d.amountOffHt === undefined) return []
  const discountHt = -round3(Math.min(d.amountOffHt, main.amountHt))
  return discountHt === 0 ? [] : [{ key: main.key, discountHt }]
}

export function totalDiscount(d: DiscountValue, lines: DiscountLine[], mainKey: string): number {
  return round3(applyDiscount(d, lines, mainKey).reduce((s, l) => s + l.discountHt, 0))
}
