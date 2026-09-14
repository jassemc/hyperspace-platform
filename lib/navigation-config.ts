import {
    ArchiveX,
    Building2,
    File,
    Inbox,
    Send,
    Trash2,
    Users,
    MessageSquare,
    Calendar,
    Settings,
    CreditCard,
    Receipt,
    User,
    Bell,
    Database,
    BarChart3,
    PieChart,
    Map,
    Clock,
    BadgeCheck,
    Target,
    FileText,
    Ticket,
    DoorOpen,
    Sparkles,
    LayoutGrid,
    Package,
    MapPin,
    BadgePercent,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Navigation types

export interface Site {
    logo: string
    name: string
    plan: string
}

/**
 * Identifies a submenu whose children are loaded at runtime instead of being
 * declared here. See `applyDynamicSubMenuItems`.
 */
export type DynamicSubMenuId = "resourceTypes"

export interface SubMenuItem {
    title: string
    url: string
    icon?: LucideIcon
    items?: NavigationItem[]
    dynamicId?: DynamicSubMenuId
}

export interface NavigationItem {
    title: string
    url: string
    icon?: LucideIcon
}

export interface MenuItem {
    title: string
    url: string
    icon: LucideIcon
    isActive: boolean
    subMenus?: SubMenuItem[]
}

export interface NavigationConfig {
    site: Site[]
    navMain: MenuItem[]
}

// Navigation configuration
export const navigationConfig: NavigationConfig = {
    site: [
        {
            logo: '/logo.png',
            name: 'Hyperspace',
            plan: 'Bizerte'
        }
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: Inbox,
            isActive: true,
            subMenus: [
                {
                    title: "Analytics",
                    url: "/dashboard/analytics",
                    icon: BarChart3,
                },
                {
                    title: "Overview",
                    url: "/dashboard/overview",
                    icon: PieChart,
                },
            ]
        },
        {
            title: "Community",
            url: "/community",
            icon: File,
            isActive: false,
            subMenus: [
                {
                    title: "Members",
                    url: "/community/members",
                    icon: Users,
                },
                {
                    title: "Companies",
                    url: "/community/companies",
                    icon: Building2,
                },
                {
                    title: "Memberships",
                    url: "/community/memberships",
                    icon: BadgeCheck,
                },
                {
                    title: "Opportunities",
                    url: "/community/opportunities",
                    icon: Target,
                },
            ]
        },
        {
            title: "Space",
            url: "/space",
            icon: Send,
            isActive: false,
            subMenus: [
                {
                    title: "Resource types",
                    url: "/settings/resource-types",
                    icon: Map,
                    dynamicId: "resourceTypes",
                    items: []
                },
                {
                    title: "Resources",
                    url: "/space/resources",
                    icon: Database,
                },
                {
                    title: "Plan",
                    url: "/space/plan",
                    icon: Calendar,
                },
            ]
        },
        {
            title: "Billing",
            url: "/billing",
            icon: ArchiveX,
            isActive: false,
            subMenus: [
                {
                    title: "Invoices",
                    url: "/billing/invoices",
                    icon: Receipt,
                },
                {
                    title: "Charges",
                    url: "/billing/charges",
                    icon: FileText,
                },
                {
                    title: "Credits",
                    url: "/billing/credits",
                    icon: Ticket,
                },
                {
                    title: "Resource rates",
                    url: "/billing/resource-rates",
                    icon: Receipt,
                },
                {
                    title: "Discounts",
                    url: "/billing/discounts",
                    icon: BadgePercent,
                },
            ]
        },
        {
            title: "Booking",
            url: "/booking",
            icon: Trash2,
            isActive: false,
            subMenus: [
                {
                    title: "Bookings",
                    url: "/booking/bookings",
                    icon: Calendar,
                },
                {
                    title: "Check-ins",
                    url: "/booking/checkins",
                    icon: DoorOpen,
                },
            ]
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
            isActive: false,
            subMenus: [
                {
                    title: "Resource types",
                    url: "/settings/resource-types",
                    icon: Database,
                },
                {
                    title: "Plan categories",
                    url: "/settings/plan-categories",
                    icon: LayoutGrid,
                },
                {
                    title: "Amenities",
                    url: "/settings/amenities",
                    icon: Sparkles,
                },
                {
                    title: "Extras",
                    url: "/settings/extras",
                    icon: Package,
                },
                {
                    title: "Locations",
                    url: "/settings/locations",
                    icon: MapPin,
                },
            ]
        },
    ]
}

// Utility functions for navigation
export const getActiveMenuItem = (pathname: string): MenuItem | undefined => {
    return navigationConfig.navMain.find(item =>
        item.url === pathname ||
        item.subMenus?.some(sub =>
            sub.url === pathname ||
            sub.items?.some(subItem => subItem.url === pathname)
        )
    )
}

export const getDefaultActiveItem = (): MenuItem => {
    return navigationConfig.navMain.find(item => item.isActive) || navigationConfig.navMain[0]
}

/**
 * Returns a copy of the menu tree with the children of every submenu marked
 * with `dynamicId` replaced by the given items.
 */
export const applyDynamicSubMenuItems = (
    navMain: MenuItem[],
    dynamicId: DynamicSubMenuId,
    items: NavigationItem[]
): MenuItem[] => {
    return navMain.map(item => {
        if (!item.subMenus?.some(sub => sub.dynamicId === dynamicId)) {
            return item
        }
        return {
            ...item,
            subMenus: item.subMenus.map(sub =>
                sub.dynamicId === dynamicId ? { ...sub, items } : sub
            ),
        }
    })
}