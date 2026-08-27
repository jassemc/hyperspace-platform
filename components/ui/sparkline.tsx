import { cn } from "@/lib/utils"

interface SparklineProps {
  /** Oldest first. Fewer than two points draws nothing — a line needs a span. */
  values: number[]
  /** Labels for the hover tooltips, parallel to `values`. */
  labels?: string[]
  tone?: "good" | "bad"
  className?: string
}

const WIDTH = 96
const HEIGHT = 32
const PADDING = 3

/**
 * A sparkline: the shape of the last few weeks beside the figure it belongs to.
 * No axes, no grid, no labels — the card states the number, this states the
 * direction. Tone repeats what the arrow and the percentage already say, so the
 * colour is never carrying the meaning alone.
 */
export function Sparkline({ values, labels, tone = "good", className }: Readonly<SparklineProps>) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = (WIDTH - PADDING * 2) / (values.length - 1)

  const points = values.map((value, index) => {
    const x = PADDING + index * step
    // A flat series sits on the midline rather than pinned to the floor.
    const y =
      max === min
        ? HEIGHT / 2
        : HEIGHT - PADDING - ((value - min) / span) * (HEIGHT - PADDING * 2)
    return { x, y, value }
  })

  const last = points[points.length - 1]
  const stroke = tone === "good" ? "stroke-emerald-500" : "stroke-rose-500"
  const fill = tone === "good" ? "fill-emerald-500" : "fill-rose-500"

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn("h-8 w-24 overflow-visible", className)}
      role="img"
      aria-label={`Last ${values.length} weeks, from ${values[0]} to ${last.value}`}
    >
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={stroke}
      />
      {/* Where the series ends is the part people look for. */}
      <circle cx={last.x} cy={last.y} r={2.5} className={fill} />

      {/* One hit area per point, so a hover says which week and how many. */}
      {points.map((point, index) => (
        <rect
          key={point.x}
          x={point.x - step / 2}
          y={0}
          width={step}
          height={HEIGHT}
          fill="transparent"
        >
          <title>
            {labels?.[index] ? `${labels[index]}: ${point.value}` : String(point.value)}
          </title>
        </rect>
      ))}
    </svg>
  )
}
