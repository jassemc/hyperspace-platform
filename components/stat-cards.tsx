import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkline } from "@/components/ui/sparkline"
import { cn } from "@/lib/utils"

export interface StatCard {
    /** Caption above the figure. */
    label: string
    value: string | number
    /** Small suffix after the figure, e.g. "active", "days". */
    unit?: string
    /** Short word in the corner badge, e.g. the unit or a category. */
    badge?: string
    icon?: LucideIcon
    /** One line under the figure explaining what it counts. */
    footer?: string
    /** Change against the previous period, as a signed percentage. */
    delta?: number
    /** Which direction is the good one — response time improves by falling. */
    deltaGoodWhen?: "up" | "down"
    /** The recent series behind the figure, oldest first. */
    series?: number[]
    seriesLabels?: string[]
}

/**
 * The summary row every list page opens with. Pages used to hand-roll this
 * markup; they now describe the figures and share the layout.
 */
export function StatCards({ cards }: Readonly<{ cards: StatCard[] }>) {
    return (
        <div className="mb-6 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon
                const rising = (card.delta ?? 0) >= 0
                const good = rising === ((card.deltaGoodWhen ?? "up") === "up")
                const Trend = rising ? TrendingUp : TrendingDown

                return (
                    <Card key={card.label} className="gap-0 py-4 shadow-xs">
                        <CardContent className="px-4">
                            <div className="flex items-center gap-2">
                                {Icon && (
                                    <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
                                        <Icon className="size-3.5" />
                                    </span>
                                )}
                                <span className="text-sm font-medium">{card.label}</span>
                            </div>

                            <div className="flex items-end justify-between gap-3 pt-3">
                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-semibold tabular-nums">
                                            {card.value}
                                        </span>
                                        {card.unit && (
                                            <span className="text-xs text-muted-foreground">
                                                {card.unit}
                                            </span>
                                        )}
                                    </div>

                                    {card.delta !== undefined && (
                                        // Arrow and number carry the meaning; the colour agrees
                                        // with them rather than saying it alone.
                                        <div
                                            className={cn(
                                                "flex items-center gap-1 pt-1.5 text-xs font-medium",
                                                good
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-rose-600 dark:text-rose-400"
                                            )}
                                        >
                                            <Trend className="size-3.5" />
                                            {Math.abs(card.delta)}%
                                        </div>
                                    )}

                                    {card.badge && !card.delta && (
                                        <Badge
                                            variant="outline"
                                            className="mt-1.5 rounded-md text-xs font-normal"
                                        >
                                            {card.badge}
                                        </Badge>
                                    )}
                                </div>

                                {card.series && (
                                    <Sparkline
                                        values={card.series}
                                        labels={card.seriesLabels}
                                        tone={good ? "good" : "bad"}
                                    />
                                )}
                            </div>

                            {card.footer && (
                                <p className="pt-3 text-xs text-muted-foreground">{card.footer}</p>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
