import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export interface StatCard {
    /** Caption above the figure. */
    label: string
    value: string | number
    /** Short word in the corner badge, e.g. the unit or a category. */
    badge?: string
    icon?: LucideIcon
    /** One line under the figure explaining what it counts. */
    footer?: string
}

/**
 * The summary row every list page opens with. Pages used to hand-roll this
 * markup; they now describe the figures and share the layout.
 */
export function StatCards({ cards }: Readonly<{ cards: StatCard[] }>) {
    return (
        <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-4 mb-6">
            {cards.map((card) => {
                const Icon = card.icon
                return (
                    <Card key={card.label} className="@container/card">
                        <CardHeader className="relative">
                            <CardDescription>{card.label}</CardDescription>
                            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                                {card.value}
                            </CardTitle>
                            {card.badge && (
                                <div className="absolute right-4 top-4">
                                    <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                                        {Icon && <Icon className="size-3" />}
                                        {card.badge}
                                    </Badge>
                                </div>
                            )}
                        </CardHeader>
                        {card.footer && (
                            <CardFooter className="flex-col items-start gap-1 text-sm">
                                <div className="text-muted-foreground">{card.footer}</div>
                            </CardFooter>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}
