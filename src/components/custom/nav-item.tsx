"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

interface NavItemProps {
  icon: LucideIcon
  label: string
  isActive?: boolean
  badge?: number | string
  onClick?: () => void
  href?: string
  isOpen?: boolean
  path?: string
}

export function NavItem({ icon: Icon, label, isActive, badge, onClick, href, isOpen = true }: NavItemProps) {
  const content = (
    <>
      <Icon size={20} className="shrink-0" />
      {isOpen && (
        <>
            <span className="flex-1 text-sm truncate">{label}</span>
            {badge !== undefined && (
                <span className="min-w-[20px] h-5 flex items-center justify-center bg-destructive text-white text-xs font-bold rounded-full px-1.5">
                {badge}
                </span>
            )}
        </>
      )}
    </>
  )

  const className = cn(
    "w-full flex items-center gap-3 py-3 rounded-xl transition-all",
    isOpen ? "px-4 text-left" : "justify-center px-2",
    isActive
      ? "bg-primary text-primary-foreground font-bold shadow-md"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  )
}
