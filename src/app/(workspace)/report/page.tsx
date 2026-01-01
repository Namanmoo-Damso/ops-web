"use client"

import {
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  Activity,
  AlertCircle,
  Clock,
  Smile,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Phone,
  LayoutDashboard,
  Grid2x2,
  Map,
  Briefcase,
  Settings
} from "lucide-react"
import { useState } from "react"
import { Sidebar, Header } from "@/components/custom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ReportPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [activePath, setActivePath] = useState("/report")
    const [periodType, setPeriodType] = useState('WEEKLY')

    const getDateString = () => {
        switch(periodType) {
            case 'DAILY': return '2025. 05. 08 (오늘)';
            case 'WEEKLY': return '2025. 05. 01 ~ 05. 07';
            case 'MONTHLY': return '2025. 05월 전체';
            case 'YEARLY': return '2025년 전체';
            default: return '기간을 선택해주세요';
        }
    }

    const emotionData = [
        { label: "긍정", value: 65, color: "bg-primary" },
        { label: "중립", value: 25, color: "bg-muted-foreground/30" },
        { label: "부정", value: 10, color: "bg-red-400" },
    ]

    const keywordData = [
        { text: "허리 통증", value: 80, size: "text-2xl", color: "text-red-500" },
        { text: "식사", value: 60, size: "text-xl", color: "text-foreground" },
        { text: "병원", value: 50, size: "text-lg", color: "text-muted-foreground" },
        { text: "손주", value: 40, size: "text-lg", color: "text-primary" },
        { text: "경로당", value: 30, size: "text-base", color: "text-muted-foreground" },
        { text: "날씨", value: 20, size: "text-sm", color: "text-muted-foreground/60" },
    ]

    const navItems = [
        { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
        { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring" },
        { icon: Map, label: "지도 뷰", path: "/map" },
        { icon: Users, label: "대상자 관리", path: "/users" },
        { icon: Briefcase, label: "직원 관리", path: "/staff" },
        { icon: Phone, label: "통화 기록", path: "/calls" },
        { icon: FileText, label: "리포트 & 통계", path: "/report" },
    ]

    const bottomNavItems = [
        { icon: Settings, label: "설정", path: "/settings" },
    ]

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar
                isOpen={isSidebarOpen}
                navItems={navItems}
                bottomNavItems={bottomNavItems}
                activePath={activePath}
                onNavigate={setActivePath}
                user={{
                    name: "박관리 센터장",
                    role: "총괄 관리자",
                    avatarColor: "bg-primary"
                }}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                
                <Header title="돌봄 성과 리포트">
                    <div className="flex items-center gap-3">
                         <Select value={periodType} onValueChange={setPeriodType}>
                            <SelectTrigger className="w-[140px] font-bold">
                                <SelectValue placeholder="기간 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DAILY">일간 (Daily)</SelectItem>
                                <SelectItem value="WEEKLY">주간 (Weekly)</SelectItem>
                                <SelectItem value="MONTHLY">월간 (Monthly)</SelectItem>
                                <SelectItem value="YEARLY">연간 (Yearly)</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 px-4 py-2 bg-background border rounded-lg text-sm font-bold text-muted-foreground">
                            <Calendar size={16} className="text-primary" />
                            {getDateString()}
                        </div>

                        <div className="w-px h-6 bg-border mx-1" />

                        <Button className="gap-2 font-bold">
                            <Download size={16} />
                            다운로드
                        </Button>
                    </div>
                </Header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <ReportCard 
                                label="전체 안부 확인율" 
                                value="98.5%" 
                                trend="+2.1%" 
                                trendUp 
                                icon={Activity} 
                                theme="brand" 
                            />
                            <ReportCard 
                                label="위험 징후 감지" 
                                value="12건" 
                                trend="-3건" 
                                trendUp={false} 
                                icon={AlertCircle} 
                                theme="danger"
                                isInverse
                            />
                            <ReportCard 
                                label="평균 통화 시간" 
                                value="4분 12초" 
                                trend="+30초" 
                                trendUp 
                                icon={Clock} 
                                theme="neutral" 
                            />
                            <ReportCard 
                                label="어르신 긍정 반응" 
                                value="65%" 
                                trend="+5%" 
                                trendUp 
                                icon={Smile} 
                                theme="neutral" 
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Emotion Chart */}
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <Smile size={18} className="text-primary" />
                                        정서 분석
                                    </h3>
                                    <Button variant="link" className="text-xs h-auto p-0 font-bold text-muted-foreground hover:text-primary">상세</Button>
                                </div>

                                <div className="flex items-center justify-center py-4">
                                    <div className="relative w-48 h-48 rounded-full" 
                                         style={{ background: 'conic-gradient(#8FA963 0% 65%, #cbd5e1 65% 90%, #f87171 90% 100%)' }}>
                                        <div className="absolute inset-4 bg-card rounded-full flex flex-col items-center justify-center">
                                            <span className="text-xs text-muted-foreground font-bold">긍정적</span>
                                            <span className="text-3xl font-black text-foreground">65%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    {emotionData.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full ${d.color}`} />
                                                <span className="text-muted-foreground font-bold">{d.label}</span>
                                            </div>
                                            <span className="font-bold text-foreground">{d.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Trend Chart */}
                            <Card className="lg:col-span-2 p-6 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <TrendingUp size={18} className="text-muted-foreground" />
                                        통화 성공 및 리스크 추이
                                    </h3>
                                    <div className="flex gap-4 text-xs font-bold">
                                        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 bg-primary rounded-sm"/>통화 성공</span>
                                        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 bg-red-400 rounded-sm"/>위험 감지</span>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-2 border-b min-h-[240px]">
                                    {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => {
                                        const successHeight = Math.random() * 50 + 40 + "%";
                                        const riskHeight = Math.random() * 15 + "%";
                                        return (
                                            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full group cursor-pointer">
                                                <div className="w-full max-w-[40px] flex flex-col justify-end h-full gap-1 relative">
                                                    <div style={{ height: riskHeight }} className="w-full bg-red-400 rounded-sm opacity-90 transition-all group-hover:opacity-100" />
                                                    <div style={{ height: successHeight }} className="w-full bg-primary rounded-sm transition-all group-hover:bg-primary/80" />
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">{day}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Recent Alerts & Keywords */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Word Cloud */}
                            <Card className="p-6">
                                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-muted-foreground" />
                                    주요 키워드
                                </h3>
                                <div className="bg-muted/30 rounded-xl p-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 min-h-[200px]">
                                    {keywordData.map((k, i) => (
                                        <span key={i} className={`font-black ${k.size} ${k.color} cursor-pointer hover:opacity-80 transition-opacity`}>
                                            {k.text}
                                        </span>
                                    ))}
                                </div>
                            </Card>

                            {/* Alert Table */}
                            <Card className="overflow-hidden">
                                <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <AlertCircle size={18} className="text-destructive" />
                                        최근 위험 리포트
                                    </h3>
                                    <Button variant="link" className="text-xs font-bold text-muted-foreground hover:text-primary h-auto p-0">전체보기</Button>
                                </div>
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-bold">대상자</TableHead>
                                            <TableHead className="font-bold">유형</TableHead>
                                            <TableHead className="font-bold">시간</TableHead>
                                            <TableHead className="text-right font-bold">상태</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { name: "이말순", type: "건강(가슴 통증)", time: "오늘 14:30", status: "완료" },
                                            { name: "박영감", type: "정서(우울)", time: "어제 10:15", status: "대기" },
                                            { name: "최정자", type: "미수신(3회)", time: "5월 2일", status: "완료" },
                                        ].map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-bold">{row.name}</TableCell>
                                                <TableCell className="text-destructive font-bold">{row.type}</TableCell>
                                                <TableCell className="text-muted-foreground">{row.time}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={row.status === '완료' ? 'secondary' : 'outline'} className={row.status === '완료' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}>
                                                        {row.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

function ReportCard({ label, value, trend, trendUp, icon: Icon, theme = "neutral", isInverse }: any) {
    const isGood = isInverse ? !trendUp : trendUp;
    
    let iconBg = "bg-muted text-muted-foreground";
    if (theme === 'brand') iconBg = "bg-primary/10 text-primary";
    if (theme === 'danger') iconBg = "bg-red-50 text-red-500";
    
    return (
        <Card className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <h3 className="text-3xl font-black text-foreground tracking-tight">{value}</h3>
            </div>
        </Card>
    )
}
