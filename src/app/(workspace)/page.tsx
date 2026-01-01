"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, Phone, Clock, Map as MapIcon, Grid2x2, MonitorPlay, MapPin, 
  Sparkles, CheckCircle2 
} from "lucide-react"
import { StatCard, FeatureCard } from "@/components/custom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Type Definitions (Mapped from Legacy API)
interface DashboardStats {
  overview: {
    totalWards: number
    activeWards: number
    totalGuardians: number
    totalCalls: number
    totalCallMinutes: number
  }
  todayStats: {
    calls: number
    emergencies: number
  }
  healthAlerts: {
    warning: number
    info: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch Logic (Ported from legacy DashboardPage)
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_access_token")
      if (!token) return // AuthGuard handles redirect

      // DEMO MODE CHECK
      if (token === "demo_token") {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setStats({
            overview: { totalWards: 120, activeWards: 118, totalGuardians: 85, totalCalls: 45, totalCallMinutes: 240 },
            todayStats: { calls: 12, emergencies: 0 },
            healthAlerts: { warning: 0, info: 2 }
        })
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/v1/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
             localStorage.removeItem("admin_access_token")
             router.replace("/login")
             return
        }
        throw new Error("데이터를 불러오는데 실패했습니다.")
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError("대시보드 정보를 가져올 수 없습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchStats()
    // Optional: Auto-refresh interval
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">데이터 로딩 중...</div>
  }

  // Fallback if error or no data (use defaults or show error)
  const safeStats = stats || {
    overview: { totalWards: 0, activeWards: 0, totalGuardians: 0, totalCalls: 0, totalCallMinutes: 0 },
    todayStats: { calls: 0, emergencies: 0 },
    healthAlerts: { warning: 0, info: 0 }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-[#4A5D23] to-[#6E7F4F] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-primary-foreground text-[10px] border-white/20">INFO</Badge>
            <span className="text-emerald-100 text-sm font-bold">시스템 정상 가동 중</span>
          </div>
          <h1 className="text-3xl font-black">
            {safeStats.overview.totalWards}명의 어르신을 케어하고 있습니다.
          </h1>
          <p className="text-emerald-50 text-sm font-medium max-w-xl leading-relaxed">
            오늘 {safeStats.todayStats.calls}건의 안부 전화가 진행되었습니다.<br/>
            실시간 모니터링 메뉴에서 상세 현황을 확인하세요.
          </p>
        </div>

        <Button 
            className="bg-white text-[#4A5D23] hover:bg-emerald-50 font-bold shadow-md"
            onClick={() => router.push("/monitoring")}
        >
          <MonitorPlay size={16} className="mr-2" />
          모니터링 뷰 이동
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
          onClick={() => router.push("/monitoring")}
        />
        <FeatureCard
          icon={MapPin}
          bgIcon={MapIcon}
          title="지도 기반 위치 관제"
          description={`등록된 ${safeStats.overview.totalWards}명의 거주지 위치가 지도에 매핑되었습니다.\n지역별 현황과 이동 동선을 시각적으로 파악하세요.`}
          actionLabel="지도 뷰 열기"
          onClick={() => router.push("/map")}
        />
      </div>

      {/* 3. Stats */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          실시간 현황
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            icon={Users} 
            label="총 등록 대상" 
            value={safeStats.overview.totalWards} 
            unit="명"
            className="[&_div:first-child>div]:bg-foreground"
          />
          <StatCard 
            icon={Clock} 
            label="오늘 진행 통화" 
            value={safeStats.todayStats.calls} 
            unit="건"
            subText={`총 ${Math.round(safeStats.overview.totalCallMinutes)}분 통화`}
          />
          <StatCard 
            icon={CheckCircle2} 
            label="위험 감지" 
            value={safeStats.healthAlerts.warning + safeStats.healthAlerts.info} // Sum of alerts?
            unit="건"
            subText={safeStats.healthAlerts.warning > 0 ? "경고 알림 존재" : "현재 안전함"}
            // Visual cue for warning
            className={safeStats.healthAlerts.warning > 0 ? "[&_div:first-child>div]:bg-red-500" : ""}
          />
          <StatCard 
            icon={Phone} 
            label="활성 피보호자" 
            value={safeStats.overview.activeWards} 
            unit="명"
            subText="시스템 연결됨"
            className="[&_div:first-child>div]:bg-amber-600"
          />
        </div>
      </div>

      {/* 4. Only show empty state if 0 wards? Or 0 calls? */}
      {safeStats.overview.totalWards === 0 && (
        <Card className="p-10 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <Phone size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
            등록된 어르신이 없습니다.
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
            대상자 업로드를 먼저 진행해주세요.
            </p>
            <Button variant="secondary" onClick={() => router.push("/onboarding/upload")}>
            대상자 등록하기
            </Button>
        </Card>
      )}

    </div>
  )
}
