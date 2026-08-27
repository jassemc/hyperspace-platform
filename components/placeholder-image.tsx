/**
 * Brand placeholder for rooms without a photo: a primary-tint field with
 * a faint hexagon lattice and the room's initial. Better than a gray
 * box. Ported from public-booking-page/components/primitives/
 * PlaceholderImage.tsx, translated onto this app's tokens (skytint/sky
 * became primary tints; the display serif became a semibold initial).
 * (No useId — the name-derived id is stable, and two rooms sharing a
 * name share an identical pattern def, which is harmless.)
 */
export function PlaceholderImage({
  name,
  className = "",
}: Readonly<{
  name: string
  className?: string
}>) {
  const patternId = `hex-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  const initial = name.trim().charAt(0).toUpperCase() || "H"
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-primary/10 ${className}`}
      role="img"
      aria-label={name}
    >
      <svg className="absolute inset-0 h-full w-full text-primary/[0.07]" aria-hidden="true">
        <defs>
          <pattern
            id={patternId}
            width="56"
            height="97"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(0.8)"
          >
            <path
              d="M28 0 L56 16 V48 L28 64 L0 48 V16 Z M28 64 L56 80 V112 L28 128 L0 112 V80 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <span className="relative text-2xl font-semibold text-primary/30" aria-hidden="true">
        {initial}
      </span>
    </div>
  )
}
