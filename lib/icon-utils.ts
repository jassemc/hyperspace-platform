import {
    Building,
    Armchair,
    DoorOpen,
    Monitor,
    Car,
    Clock,
    HelpCircle,
    type LucideIcon,
} from "lucide-react"

/**
 * Maps Font Awesome icon class names to Lucide React icon components.
 * Returns a default icon (HelpCircle) if no mapping is found.
 */
export function getIconFromFontAwesome(faClassName: string | null | undefined): LucideIcon {
    if (!faClassName) {
        return HelpCircle
    }

    // Normalize the class name (remove 'fa-' prefix, handle variations)
    const normalized = faClassName.toLowerCase().trim().replace(/^fa-/, "")

    const iconMap: Record<string, LucideIcon> = {
        // Building icons
        building: Building,
        "building-o": Building,
        "building-2": Building,
        
        // Chair/Furniture icons
        chair: Armchair,
        "chair-office": Armchair,
        "armchair": Armchair,
        
        // Door icons
        door: DoorOpen,
        "door-open": DoorOpen,
        "door-closed": DoorOpen,
        
        // Desk/Monitor icons
        desk: Monitor,
        "desktop": Monitor,
        "laptop": Monitor,
        "monitor": Monitor,
        "computer": Monitor,
        
        // Vehicle icons
        car: Car,
        "automobile": Car,
        "vehicle": Car,
        
        // Time icons
        clock: Clock,
        "clock-o": Clock,
        "time": Clock,
        
        // Add more mappings as needed
    }

    return iconMap[normalized] || HelpCircle
}
