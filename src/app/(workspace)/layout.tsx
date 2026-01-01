"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Users, Phone, FileText, Settings, Clock, 
  Map as MapIcon, Grid2x2, Briefcase, UserCircle 
} from "lucide-react"
import { Sidebar, Header } from "@/components/custom"
import AuthGuard from "@/components/auth/AuthGuard"

// Types
type UserRole = 'MANAGER' | 'STAFF'

interface UserProfile {
  name: string
  role: UserRole
  team?: string
  avatarColor?: string
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // State
  const [currentRole, setCurrentRole] = useState<UserRole>('MANAGER')
  const [isSidebarOpen] = useState(true) // Sidebar toggle logic can be added later

  // Mock Profile Data (In real app, fetch from User Context/API)
  const managerProfile: UserProfile = { name: "박관리 센터장", role: "MANAGER", avatarColor: "bg-[#4A5D23]" }
  const staffProfile: UserProfile = { name: "김복지 선생님", role: "STAFF", team: "방문 1팀", avatarColor: "bg-primary" }
  const activeProfile = currentRole === 'MANAGER' ? managerProfile : staffProfile

  // Navigation Config
  const mainNavItems = currentRole === 'MANAGER' 
    ? [
        { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" }, // Maps to / via mapping in Sidebar? Or we should use real path /
        // Wait, I mapped /dashboard to / in Sidebar component logic? 
        // Step 757 Sidebar: if (path === '/dashboard') return '/'
        // So I can use /dashboard here.
        { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
        { icon: MapIcon, label: "지도 뷰", path: "/map" },
        { icon: Users, label: "전체 대상자 관리", path: "/users" },
        { icon: Briefcase, label: "직원 관리", path: "/staff" },
        { icon: Phone, label: "통화 기록", path: "/calls" },
        { icon: FileText, label: "리포트 & 통계", path: "/report" },
      ]
    : [
        { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
        { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
        { icon: MapIcon, label: "지도 뷰", path: "/map" },
        { icon: UserCircle, label: "내 담당 어르신", path: "/my-seniors" },
        { icon: Clock, label: "방문 일정 관리", path: "/schedule" },
        { icon: Phone, label: "통화 기록", path: "/calls" },
        { icon: FileText, label: "리포트 & 통계", path: "/report" },
      ]

  const bottomNavItems = [
    { icon: Settings, label: "시스템 설정", path: "/settings" },
  ]

  // Header Logic: Title based on role (or path?)
  const title = currentRole === 'MANAGER' ? '기관 통합 관제' : '내 업무 현황'

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          navItems={mainNavItems}
          bottomNavItems={bottomNavItems}
          user={{
            name: activeProfile.name,
            role: currentRole === 'MANAGER' ? '총괄 관리자' : '직원',
            team: activeProfile.team,
            avatarColor: activeProfile.avatarColor,
          }}
          // activePath handled internally by Sidebar via usePathname
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          
          {/* Header */}
          <Header 
            title={title}
            notificationCount={2}
            userInitial={activeProfile.name[0]}
          >
            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <button 
                onClick={() => setCurrentRole('MANAGER')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  currentRole === 'MANAGER' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground'
                }`}
              >
                관리자
              </button>
              <button 
                onClick={() => setCurrentRole('STAFF')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  currentRole === 'STAFF' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground'
                }`}
              >
                직원
              </button>
            </div>
          </Header>

          {/* Children (Page Content) */}
          <main className="flex-1 overflow-y-auto">
             {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
