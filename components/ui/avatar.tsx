import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
  { bg: "bg-violet-500", text: "text-violet-50", ring: "ring-violet-500/20" },
  { bg: "bg-blue-500", text: "text-blue-50", ring: "ring-blue-500/20" },
  { bg: "bg-emerald-500", text: "text-emerald-50", ring: "ring-emerald-500/20" },
  { bg: "bg-amber-500", text: "text-amber-50", ring: "ring-amber-500/20" },
  { bg: "bg-rose-500", text: "text-rose-50", ring: "ring-rose-500/20" },
  { bg: "bg-cyan-500", text: "text-cyan-50", ring: "ring-cyan-500/20" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-50", ring: "ring-fuchsia-500/20" },
  { bg: "bg-teal-500", text: "text-teal-50", ring: "ring-teal-500/20" },
]

function getColorIndex(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

function getInitial(email: string): string {
  const name = email.split("@")[0]
  const firstChar = name.replace(/[^a-zA-Z0-9]/g, "").charAt(0)
  return firstChar ? firstChar.toUpperCase() : "?"
}

type AvatarProps = {
  email?: string
  name?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Avatar({ email, name, size = "md", className }: AvatarProps) {
  const label = email || name || ""
  const initial = getInitial(label)
  const color = AVATAR_COLORS[getColorIndex(label)]

  const sizeClasses = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2",
        color.bg,
        color.text,
        color.ring,
        sizeClasses[size],
        className
      )}
      aria-label={`Avatar de ${label}`}
    >
      {initial}
    </div>
  )
}
