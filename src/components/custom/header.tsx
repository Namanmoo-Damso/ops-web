"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ReactNode } from "react"

interface HeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  notificationCount?: number
  userInitial?: string
}

export function Header({ title, subtitle, children, notificationCount = 0, userInitial = "관" }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-6">
        {children}
        
        {children && <Separator orientation="vertical" className="h-6" />}
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
              {notificationCount}
            </span>
          )}
        </Button>
        
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
