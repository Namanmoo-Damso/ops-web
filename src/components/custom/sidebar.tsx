"use client"

import { cn } from "@/lib/utils"
import { LucideIcon, LogOut } from "lucide-react"
import { NavItem } from "./nav-item"
import { Badge } from "@/components/ui/badge"
import { usePathname } from "next/navigation"

interface NavItemConfig {
  icon: LucideIcon
  label: string
  path: string
  badge?: string | number
}

interface UserProfile {
  name: string
  role: string
  team?: string
  avatarColor?: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle?: () => void
  navItems: NavItemConfig[]
  activePath?: string
  onNavigate?: (path: string) => void
  user: UserProfile
  bottomNavItems?: NavItemConfig[]
}

export function Sidebar({ 
  isOpen, 
  onToggle,
  navItems, 
  activePath, 
  onNavigate, 
  user,
  bottomNavItems 
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
      // Dashboard special case: treat /dashboard path as active for root /
      if (path === '/dashboard' && pathname === '/') return true
      return pathname === path
  }

  const getHref = (path: string) => {
      // Dashboard special case: map /dashboard link to root /
      if (path === '/dashboard') return '/'
      return path
  }

  return (
    <aside className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300",
      isOpen ? "w-64" : "w-20"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border justify-between">
        <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-sm shrink-0">
            담
            </div>
            {isOpen && (
            <span className="ml-3 font-black text-xl text-foreground tracking-tight">
                담소 Damso
            </span>
            )}
        </div>
        {/* Toggle Button handling if needed, or parent handles it via props */}
        {/* If onToggle is provided, we can show a toggle button, but the design mockup had it in the header usually or here? */}
        {/* Original Mockup code had toggle button inside sidebar header */}
        {/* We reuse the parent's state toggle logic if we want, but usually sidebar component should expose toggle */}
        {/* User's mockup `01_dashboard.tsx` had toggle inside sidebar header area. */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={isOpen ? item.label : ""}
            isActive={isActive(item.path)}
            badge={item.badge !== undefined ? (typeof item.badge === 'string' ? parseInt(item.badge) : item.badge) : undefined}
            href={getHref(item.path)}
          />
        ))}
      </nav>

      {/* Bottom Nav */}
      {bottomNavItems && (
        <div className="p-4 border-t border-border space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={isOpen ? item.label : ""}
              isActive={isActive(item.path)}
              href={getHref(item.path)}
            />
          ))}
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0",
            user.avatarColor || "bg-primary"
          )}>
            {user.name[0]}
          </div>
          {isOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                <Badge variant="secondary" className="text-[10px] mt-0.5">
                  {user.team || user.role}
                </Badge>
              </div>
              <LogOut size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
