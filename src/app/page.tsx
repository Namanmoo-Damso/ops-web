"use client"

import { 
  LayoutDashboard,
  Users,
  Phone,
  FileText,
  Settings,
  Clock,
  Map,
  Grid2x2,
  MonitorPlay,
  MapPin,
  Sparkles,
  UserCircle,
  Briefcase,
  CheckCircle2
} from "lucide-react"
import { useState } from "react"
import { Sidebar, Header, StatCard, FeatureCard } from "@/components/custom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// 타입 정의
type UserRole = 'MANAGER' | 'STAFF'

interface UserProfile {
  name: string
  role: UserRole
  team?: string
  avatarColor?: string
}

export default function DashboardPage() {
  // State
  const [currentRole, setCurrentRole] = useState<UserRole>('MANAGER')
  const [activePath, setActivePath] = useState("/dashboard")
  const [isSidebarOpen] = useState(true)

  // Mock Data
  const managerProfile: UserProfile = { name: "박관리 센터장", role: "MANAGER", avatarColor: "bg-[#4A5D23]" }
  const staffProfile: UserProfile = { name: "김복지 선생님", role: "STAFF", team: "방문 1팀", avatarColor: "bg-primary" }
  const activeProfile = currentRole === 'MANAGER' ? managerProfile : staffProfile

  // Navigation Config
  const mainNavItems = currentRole === 'MANAGER' 
    ? [
        { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
        { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
        { icon: Map, label: "지도 뷰", path: "/map" },
        { icon: Users, label: "전체 대상자 관리", path: "/users" },
        { icon: Briefcase, label: "직원 관리", path: "/staff" },
        { icon: Phone, label: "통화 기록", path: "/calls" },
        { icon: FileText, label: "리포트 & 통계", path: "/report" },
      ]
    : [
        { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
        { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
        { icon: Map, label: "지도 뷰", path: "/map" },
        { icon: UserCircle, label: "내 담당 어르신", path: "/my-seniors" },
        { icon: Clock, label: "방문 일정 관리", path: "/schedule" },
        { icon: Phone, label: "통화 기록", path: "/calls" },
        { icon: FileText, label: "리포트 & 통계", path: "/report" },
      ]

  const bottomNavItems = [
    { icon: Settings, label: "시스템 설정", path: "/settings" },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        navItems={mainNavItems}
        bottomNavItems={bottomNavItems}
        activePath={activePath}
        onNavigate={setActivePath}
        user={{
          name: activeProfile.name,
          role: currentRole === 'MANAGER' ? '총괄 관리자' : '직원',
          team: activeProfile.team,
          avatarColor: activeProfile.avatarColor,
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <Header 
          title={currentRole === 'MANAGER' ? '기관 통합 관제' : '내 업무 현황'}
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* 1. Welcome Banner */}
            <div className="bg-gradient-to-r from-[#4A5D23] to-[#6E7F4F] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-primary text-primary-foreground text-[10px] border-white/20">NEW</Badge>
                  <span className="text-emerald-100 text-sm font-bold">시스템 설정 완료</span>
                </div>
                <h1 className="text-3xl font-black">120명의 어르신이 연결되었습니다! 🎉</h1>
                <p className="text-emerald-50 text-sm font-medium max-w-xl leading-relaxed">
                  대상자 명단 등록과 AI 시나리오 설정이 모두 끝났습니다.<br/>
                  이제 담소의 <strong>핵심 관제 기능</strong>을 사용하여 어르신들을 실시간으로 케어해보세요.
                </p>
              </div>

              <Button className="bg-white text-[#4A5D23] hover:bg-emerald-50 font-bold shadow-md">
                <Phone size={16} className="mr-2" />
                첫 안부전화 시작하기
              </Button>
            </div>

            {/* 2. Tech Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard
                icon={MonitorPlay}
                bgIcon={Grid2x2}
                title="실시간 영상 모니터링"
                description={`여러 어르신과의 통화 화면을 한눈에 확인합니다.\n응급 상황 발생 시 해당 화면이 자동으로 팝업됩니다.`}
                actionLabel="모니터링 뷰 열기"
                onClick={() => setActivePath("/monitoring")}
              />
              <FeatureCard
                icon={MapPin}
                bgIcon={Map}
                title="지도 기반 위치 관제"
                description={`등록된 120명의 거주지 위치가 지도에 매핑되었습니다.\n지역별 현황과 이동 동선을 시각적으로 파악하세요.`}
                actionLabel="지도 뷰 열기"
                onClick={() => setActivePath("/map")}
              />
            </div>

            {/* 3. Initial Stats */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                금일현황
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  icon={Users} 
                  label="총 등록 대상" 
                  value={120} 
                  unit="명"
                  className="[&_div:first-child>div]:bg-foreground"
                />
                <StatCard 
                  icon={Clock} 
                  label="오늘 예정 통화" 
                  value={120} 
                  unit="건"
                  subText="오후 2시 시작 예정"
                />
                <StatCard 
                  icon={CheckCircle2} 
                  label="위험 감지" 
                  value={0} 
                  unit="건"
                  subText="현재 안전함"
                />
                <StatCard 
                  icon={Phone} 
                  label="연결 대기 중" 
                  value={120} 
                  unit="명"
                  className="[&_div:first-child>div]:bg-amber-600"
                />
              </div>
            </div>

            {/* 4. Empty State */}
            <Card className="p-10 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Phone size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                아직 진행된 통화가 없습니다.
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                설정하신 시간에 AI가 자동으로 전화를 걸기 시작합니다.<br/>
                혹은 <strong>[모니터링 뷰]</strong>에서 수동으로 연결할 수 있습니다.
              </p>
              <Button variant="secondary">
                AI 강제 실행하기 (즉시 시작)
              </Button>
            </Card>

          </div>
        </main>
      </div>
    </div>
  )
}
