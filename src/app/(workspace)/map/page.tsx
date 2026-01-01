"use client"

import {
    Grid2x2,
    Map as MapIcon,
    Siren,
    Settings,
    LogOut,
    Filter,
    Navigation,
    MapPin,
    Phone,
    Layers,
    LocateFixed,
    X,
    Clock,
    ThermometerSun,
    MonitorPlay,
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    UserCircle
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sidebar, Header } from "@/components/custom"

// --- Navigation Config ---
const mainNavItems = [
    { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
    { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
    { icon: MapIcon, label: "지도 뷰", path: "/map" },
    { icon: Users, label: "전체 대상자 관리", path: "/users" },
    { icon: Briefcase, label: "직원 관리", path: "/staff" },
    { icon: Phone, label: "통화 기록", path: "/calls" },
    { icon: FileText, label: "리포트 & 통계", path: "/report" },
]

const bottomNavItems = [
    { icon: Settings, label: "시스템 설정", path: "/settings" },
]

// --- Mock Data ---
const MAP_LOCATIONS = [
    { id: 1, name: "이말순", status: "WARNING", x: 45, y: 30, address: "서울시 종로구 평창동 12-3", lastUpdate: "방금 전", battery: 15 },
    { id: 2, name: "박철수", status: "NORMAL", x: 60, y: 50, address: "서울시 종로구 구기동 88", lastUpdate: "10분 전", battery: 82 },
    { id: 3, name: "김영희", status: "NORMAL", x: 20, y: 40, address: "서울시 서대문구 홍제동 104", lastUpdate: "2분 전", battery: 90 },
    { id: 4, name: "최정자", status: "CAUTION", x: 75, y: 20, address: "서울시 성북구 정릉동 33", lastUpdate: "1시간 전", battery: 40 },
    { id: 5, name: "정민수", status: "NORMAL", x: 30, y: 70, address: "서울시 은평구 불광동 55", lastUpdate: "5분 전", battery: 75 },
    { id: 6, name: "강동원", status: "NORMAL", x: 55, y: 65, address: "서울시 종로구 신영동 12", lastUpdate: "방금 전", battery: 60 },
]

export default function MapPage() {
    const [selectedPin, setSelectedPin] = useState<number | null>(null)
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'WARNING'>('ALL')
    const [showHeatmap, setShowHeatmap] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const filteredLocations = filterStatus === 'ALL' 
        ? MAP_LOCATIONS 
        : MAP_LOCATIONS.filter(l => l.status === 'WARNING' || l.status === 'CAUTION')

    const selectedTarget = MAP_LOCATIONS.find(l => l.id === selectedPin)

    return (
        <div className="flex h-screen bg-[#F5F7FA]">
            <Sidebar
                isOpen={isSidebarOpen}
                navItems={mainNavItems}
                bottomNavItems={bottomNavItems}
                activePath="/map"
                user={{
                    name: "박관리 센터장",
                    role: "총괄 관리자",
                    avatarColor: "bg-[#4A5D23]"
                }}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Header title="위치 기반 관제 (GIS)" notificationCount={1} userInitial="박">
                    <div className="flex items-center gap-4">
                        {/* Status Stats in Header */}
                         <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/>정상: 110</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>위험: 1</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/>주의: 9</span>
                        </div>
                    </div>
                </Header>

                {/* Main Map Area */}
                <main className="flex-1 relative bg-slate-100 overflow-hidden">
                    
                    {/* Floating Controls (Inside Map) */}
                    <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
                        
                        {/* Empty Left or Breadcrumbs if needed */}
                        <div></div>

                        {/* Right Control Group */}
                        <div className="pointer-events-auto flex flex-col gap-3 items-end">
                            {/* Weather Widget (Light) */}
                            <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full shadow-md flex items-center gap-3 text-sm font-bold text-slate-600">
                                <ThermometerSun size={18} className="text-amber-500" />
                                <span>서울 종로구 24°C</span>
                                <span className="w-px h-3 bg-slate-200" />
                                <span className="text-xs text-slate-400">맑음</span>
                            </div>

                            {/* Search & Filter (Light) */}
                            <div className="flex gap-2">
                                <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-1 rounded-xl shadow-md flex">
                                    <button 
                                        onClick={() => setFilterStatus('ALL')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'ALL' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        전체
                                    </button>
                                    <button 
                                        onClick={() => setFilterStatus('WARNING')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterStatus === 'WARNING' ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Siren size={12} /> 위험만
                                    </button>
                                </div>
                                
                                <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-1 rounded-xl shadow-md w-12 flex flex-col items-center gap-1">
                                    <button 
                                        onClick={() => setShowHeatmap(!showHeatmap)}
                                        className={`p-2 rounded-lg transition-colors ${showHeatmap ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                        title="히트맵 보기"
                                    >
                                        <Layers size={20} />
                                    </button>
                                    <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors" title="내 위치">
                                        <LocateFixed size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Background (Simulated Light Grid) */}
                    <div 
                        className="w-full h-full relative overflow-hidden bg-[#E2E8F0]"
                        style={{
                            backgroundImage: `
                                linear-gradient(#cbd5e1 1px, transparent 1px),
                                linear-gradient(90deg, #cbd5e1 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }}
                        onClick={() => setSelectedPin(null)}
                    >
                        {/* Decorative Blur Blobs */}
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-white/30 -rotate-12 blur-xl" /> 
                        <div className="absolute top-0 right-1/3 h-full w-4 bg-white/30 rotate-6 blur-xl" />

                        {filteredLocations.map((loc) => (
                            <MapPinMarker 
                                key={loc.id} 
                                data={loc} 
                                isSelected={selectedPin === loc.id}
                                onClick={(e: any) => {
                                    e.stopPropagation();
                                    setSelectedPin(loc.id);
                                }}
                            />
                        ))}
                    </div>

                    {/* Detail Overlay (Light) */}
                    {selectedTarget && (
                        <div className="absolute right-6 top-24 bottom-6 w-[360px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300 z-20">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-3xl">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedTarget.name}</h2>
                                        <Badge variant={selectedTarget.status === "WARNING" ? "destructive" : "secondary"} className="text-[10px]">
                                            {selectedTarget.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock size={12} /> 마지막 위치 업데이트: <span className="text-slate-700 font-medium">{selectedTarget.lastUpdate}</span>
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedPin(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                    <X size={20}/>
                                </Button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                
                                {/* Address */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                                        <MapPin size={14} /> 거주지 주소
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                        {selectedTarget.address}
                                    </p>
                                    <Button variant="outline" className="mt-3 w-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary gap-2 h-9 text-xs font-bold bg-white">
                                        <Navigation size={14} /> 카카오맵 길찾기 연동
                                    </Button>
                                </div>

                                {/* Status */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 block mb-1">배터리 상태</span>
                                        <span className={`text-lg font-bold ${selectedTarget.battery < 20 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {selectedTarget.battery}%
                                        </span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 block mb-1">통신 상태</span>
                                        <span className="text-lg font-bold text-blue-500">LTE</span>
                                    </div>
                                </div>

                                {/* Staff */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase">인근 순찰 요원</h4>
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">김</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700">김복지 (500m 거리)</p>
                                            <p className="text-[10px] text-slate-400">현재 다른 업무 중</p>
                                        </div>
                                        <Button size="sm" variant="secondary" className="h-7 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm">
                                            호출
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold h-12 shadow-sm">
                                        영상 보기
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 gap-2 shadow-md shadow-primary/20">
                                        <Phone size={16} /> 전화 걸기
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

function MapPinMarker({ data, isSelected, onClick }: any) {
    const isWarning = data.status === "WARNING"
    const isCaution = data.status === "CAUTION"
    
    const pinColor = isWarning 
        ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
        : isCaution 
            ? "bg-amber-500 shadow-sm" 
            : "bg-primary shadow-sm"

    return (
        <div 
            onClick={onClick}
            className="absolute flex flex-col items-center cursor-pointer group hover:z-50 transition-all"
            style={{ 
                left: `${data.x}%`, 
                top: `${data.y}%`,
                transform: isSelected ? 'scale(1.2) translateY(-10px)' : 'scale(1)',
                zIndex: isSelected ? 50 : 10
            }}
        >
            <div className={`
                mb-1 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md whitespace-nowrap transition-all border border-black/10
                ${isSelected ? 'bg-slate-800 opacity-100 translate-y-0' : 'bg-slate-600 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
            `}>
                {data.name}
            </div>

            <div className="relative">
                {isWarning && <span className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping" />}
                <div className={`w-4 h-4 rounded-full border-2 border-white ${pinColor}`} />
                <div className="w-0.5 h-3 bg-slate-400 mx-auto" />
            </div>
        </div>
    )
}
