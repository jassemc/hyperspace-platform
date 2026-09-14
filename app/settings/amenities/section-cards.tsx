import { escalateAuthError } from "@/lib/auth/api-auth"
import { getListAmenities } from "@/lib/service"
import type { AmenityDto } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"
import { StatCards } from "@/components/stat-cards"
import { SparklesIcon, ImageIcon } from "lucide-react"

export async function SectionCards() {
  let amenities: AmenityDto[] = []
  let total = 0

  try {
    const response = await getListAmenities({ limit: 100, offset: 0, sort: "ASC" })
    const page = pageResult<AmenityDto>(response)
    amenities = page.results
    total = page.total
  } catch (error) {
    escalateAuthError(error)
    console.warn("Failed to load amenity stats", error)
  }

  const withIcon = amenities.filter((amenity) => Boolean(amenity.icon)).length

  return (
    <StatCards
      cards={[
        {
          label: "Total amenities",
          value: total,
          badge: "Vocabulary",
          icon: SparklesIcon,
          footer: "Shared across resources and extras",
        },
        {
          label: "With an icon",
          value: withIcon,
          badge: "Icons",
          icon: ImageIcon,
          footer: "Amenities that render with an icon",
        },
      ]}
    />
  )
}
