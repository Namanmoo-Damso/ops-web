"use client"

import {
    Grid2x2,
    Grid3x3,
    LayoutGrid,
    Maximize,
    Mic,
    PhoneCall,
    AlertTriangle,
    User,
    Radio,
    Map,
    MonitorPlay,
    Contact,
    Stethoscope,
    Pill,
    Volume2,
    LayoutDashboard,
    Users,
    Briefcase,
    Phone,
    FileText,
    Settings,
    UserCircle,
    Clock
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Sidebar, Header } from "@/components/custom"

// --- Navigation Config (Duplicated from Dashboard for standalone page refactor) ---
const mainNavItems = [
    { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
    { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
    { icon: Map, label: "지도 뷰", path: "/map" },
    { icon: Users, label: "전체 대상자 관리", path: "/users" },
    { icon: Briefcase, label: "직원 관리", path: "/staff" },
    { icon: Phone, label: "통화 기록", path: "/calls" },
    { icon: FileText, label: "리포트 & 통계", path: "/report" },
]

const bottomNavItems = [
    { icon: Settings, label: "시스템 설정", path: "/settings" },
]

// --- Mock Data ---
const LIVE_SESSIONS = [
    { 
        id: 1, name: "이말순", age: 82, status: "WARNING", 
        imgColor: "bg-slate-200", transcript: "아이고.. 가슴이 자꾸 조여오네.. 숨 쉬기가 힘들어..",
        guardian: "아들 박성훈 (010-1234-5678)", manager: "김복지 (방문1팀)",
        diseases: "고혈압, 협심증", medication: "혈압약 (아침/저녁)"
    },
    { 
        id: 2, name: "박철수", age: 79, status: "NORMAL", 
        imgColor: "bg-slate-100", transcript: "오늘 점심은 복지관에서 준 도시락 먹었어.",
        guardian: "딸 박지민 (010-9876-5432)", manager: "이성실 (방문1팀)",
        diseases: "관절염", medication: "진통제 (필요시)"
    },
    { 
        id: 3, name: "김영희", age: 75, status: "NORMAL", 
        imgColor: "bg-slate-100", transcript: "날씨가 좋아서 오전에 공원 한 바퀴 돌고 왔지.",
        guardian: "배우자 최영감 (010-1111-2222)", manager: "김복지 (방문1팀)",
        diseases: "초기 치매, 당뇨", medication: "인슐린 (식전)"
    },
    { 
        id: 4, name: "최정자", age: 88, status: "CAUTION", 
        imgColor: "bg-slate-200", transcript: "아무도 안 찾아오니까 적적하네...",
        guardian: "손자 이민호 (010-3333-4444)", manager: "최열정 (방문2팀)",
        diseases: "우울증", medication: "항우울제 (취침 전)"
    },
    { 
        id: 5, name: "정민수", age: 72, status: "NORMAL", 
        imgColor: "bg-slate-100", transcript: "허허, 그래 고맙다. AI가 말벗도 해주고.",
        guardian: "없음 (독거)", manager: "박관리 (센터장)",
        diseases: "없음", medication: "종합비타민"
    },
    { 
        id: 6, name: "강동원", age: 81, status: "NORMAL", 
        imgColor: "bg-slate-100", transcript: "약은 아까 먹었어. 걱정 안 해도 돼.",
        guardian: "아내 김순자 (동거)", manager: "김복지 (방문1팀)",
        diseases: "고지혈증", medication: "고지혈증약 (저녁)"
    },
    { id: 7, name: "오영수", age: 77, status: "NORMAL", imgColor: "bg-slate-100", transcript: "노인정 친구들이랑 화투 한 판 쳤어.", guardian: "없음", manager: "김복지", diseases: "-", medication: "-" },
    { id: 8, name: "윤여정", age: 74, status: "NORMAL", imgColor: "bg-slate-100", transcript: "저녁엔 드라마 봐야지.", guardian: "아들", manager: "최열정", diseases: "-", medication: "-" },
]

export default function MonitoringPage() {
    const [gridCols, setGridCols] = useState<2 | 3 | 4>(4) 
    const [selectedFeed, setSelectedFeed] = useState<number | null>(null)
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'WARNING'>('ALL')
    const [alertBlink, setAlertBlink] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => setAlertBlink(prev => !prev), 800)
        return () => clearInterval(interval)
    }, [])

    const filteredSessions = filterStatus === 'ALL' 
        ? LIVE_SESSIONS 
        : LIVE_SESSIONS.filter(s => s.status === 'WARNING' || s.status === 'CAUTION')

    const selectedSession = LIVE_SESSIONS.find(s => s.id === selectedFeed)

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA]">
            {/* Main Layout */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Standard Header with Controls injected */}
                <Header title="실시간 영상 모니터링" notificationCount={1} userInitial="박">
                    <div className="flex items-center gap-4">
                         {/* Status Summary */}
                         <div className="hidden md:flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-xs text-slate-500 font-medium">
                                접속 중: <span className="text-slate-800 font-bold text-sm">8</span>
                            </span>
                            <div className="h-3 w-px bg-slate-200" />
                            <span className="text-xs text-slate-500 font-medium">
                                위험 감지: <span className="text-red-500 font-bold text-sm animate-pulse">1</span>
                            </span>
                        </div>

                        {/* Filter Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button 
                                onClick={() => setFilterStatus('ALL')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${filterStatus === 'ALL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                전체
                            </button>
                            <button 
                                onClick={() => setFilterStatus('WARNING')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterStatus === 'WARNING' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <AlertTriangle size={10} />
                                위험
                            </button>
                        </div>

                        {/* Layout Controls */}
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex gap-1">
                                <button onClick={() => setGridCols(2)} className={`p-1.5 rounded ${gridCols === 2 ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Grid2x2 size={16}/></button>
                                <button onClick={() => setGridCols(3)} className={`p-1.5 rounded ${gridCols === 3 ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Grid3x3 size={16}/></button>
                                <button onClick={() => setGridCols(4)} className={`p-1.5 rounded ${gridCols === 4 ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16}/></button>
                            </div>
                        </div>
                    </div>
                </Header>

                {/* Video Grid Content (Light Theme) */}
                <main className="flex-1 overflow-y-auto p-4 bg-[#F5F7FA]">
                    <div className={`grid gap-4 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                        {filteredSessions.map((session) => (
                            <VideoCard 
                                key={session.id} 
                                data={session} 
                                alertBlink={alertBlink} 
                                onSelect={() => setSelectedFeed(session.id)}
                                isSelected={selectedFeed === session.id}
                            />
                        ))}
                        
                        {/* Empty Slots */}
                        {[...Array(Math.max(0, 12 - filteredSessions.length))].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-white rounded-xl border border-slate-200/50 flex flex-col items-center justify-center text-slate-300 gap-2 shadow-sm">
                                <Radio size={24} className="opacity-20" />
                                <span className="text-[10px] font-bold opacity-40">연결 대기</span>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Detail Panel (Light Theme) */}
            <Sheet open={!!selectedFeed} onOpenChange={() => setSelectedFeed(null)}>
                <SheetContent className="w-[420px] bg-white border-l border-slate-200 p-0 sm:max-w-md">
                    {selectedSession && (
                        <div className="flex flex-col h-full">
                            <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <SheetTitle className="flex items-center gap-2 text-slate-800">
                                    <MonitorPlay size={18} className="text-primary" />
                                    세부 모니터링
                                </SheetTitle>
                            </SheetHeader>

                            <div className="p-5 space-y-6 overflow-y-auto flex-1">
                                {/* Profile */}
                                <Card className="bg-white border-slate-200 p-4 flex gap-4 items-center shadow-sm">
                                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-2xl font-bold text-slate-400">
                                        {selectedSession.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                            {selectedSession.name} 
                                            <span className="text-sm font-normal text-slate-400">({selectedSession.age}세)</span>
                                        </h4>
                                        <Badge variant={selectedSession.status === 'WARNING' ? 'destructive' : 'secondary'} className="mt-1">
                                            {selectedSession.status === 'WARNING' ? '위험 감지됨' : '상태 안전'}
                                        </Badge>
                                    </div>
                                </Card>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="bg-slate-50 border-slate-100 p-3 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-1 text-slate-400 text-[10px] font-bold uppercase">
                                            <Stethoscope size={12} /> 기저질환
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{selectedSession.diseases}</p>
                                    </Card>
                                    <Card className="bg-slate-50 border-slate-100 p-3 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-1 text-slate-400 text-[10px] font-bold uppercase">
                                            <Pill size={12} /> 복약 정보
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{selectedSession.medication}</p>
                                    </Card>
                                </div>

                                {/* Contacts */}
                                <div className="space-y-1">
                                    <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase ml-1">비상 연락망</h5>
                                    <Card className="bg-white border-slate-200 divide-y divide-slate-100 shadow-sm">
                                        <div className="p-3 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><Contact size={16}/></div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold">보호자</p>
                                                    <p className="text-sm text-slate-700 font-medium">{selectedSession.guardian}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" className="text-xs h-7">호출</Button>
                                        </div>
                                        <div className="p-3 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><UserCircle size={16}/></div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold">담당자</p>
                                                    <p className="text-sm text-slate-700 font-medium">{selectedSession.manager}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" className="text-xs h-7">호출</Button>
                                        </div>
                                    </Card>
                                </div>

                                {/* Transcript */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                            <Mic size={12} /> 실시간 대화 로그
                                        </span>
                                        <Badge variant="destructive" className="text-[10px] animate-pulse">● Recording</Badge>
                                    </div>
                                    <Card className="bg-slate-900 border-slate-800 p-4 min-h-[200px] space-y-4 shadow-inner">
                                        <div className="flex gap-3 opacity-40">
                                            <div className="text-[10px] font-black text-primary shrink-0 w-8 pt-1">AI</div>
                                            <p className="text-sm text-slate-300">식사는 맛있게 하셨어요?</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-[10px] font-black text-primary shrink-0 w-8 pt-1">AI</div>
                                            <p className="text-sm text-slate-100">어디 불편하신 곳은 없으시고요?</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-[10px] font-black text-white shrink-0 w-8 pt-1">{selectedSession.name}</div>
                                            <p className="text-base text-white font-medium leading-relaxed bg-slate-800 p-2.5 rounded-lg rounded-tl-none border border-slate-700">
                                                {selectedSession.transcript}
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                                <Button className="w-full py-6 bg-red-600 hover:bg-red-700 font-bold text-white shadow-md shadow-red-100">
                                    <PhoneCall size={20} className="mr-2" />
                                    긴급 통화 개입 (Takeover)
                                </Button>
                                <div className="flex items-center justify-center gap-2">
                                    <Volume2 size={14} className="text-slate-400"/>
                                    <span className="text-xs text-slate-400 font-medium">관리자 마이크가 기본적으로 음소거 상태입니다.</span>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}

// --- Video Card Component (Light Theme) ---
function VideoCard({ data, alertBlink, onSelect, isSelected }: { data: typeof LIVE_SESSIONS[0], alertBlink: boolean, onSelect: () => void, isSelected: boolean }) {
    const isWarning = data.status === "WARNING"
    
    // Light Theme Borders
    const borderClass = isWarning 
        ? (alertBlink ? "border-red-500 ring-4 ring-red-100" : "border-red-500")
        : isSelected 
            ? "border-primary ring-4 ring-primary/20"
            : "border-slate-200 hover:border-slate-300"

    return (
        <div 
            onClick={onSelect}
            className={`relative bg-white rounded-xl overflow-hidden border-2 cursor-pointer group transition-all aspect-[3/4] shadow-sm hover:shadow-md ${borderClass}`}
        >
            {/* Placeholder Background */}
            <div className={`absolute inset-0 opacity-10 ${data.imgColor.replace('bg-', 'bg-')} flex items-center justify-center transition-opacity group-hover:opacity-20`}>
                <User size={48} className="text-slate-400" />
            </div>
            
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-slate-100">
                    <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="font-bold text-sm text-slate-800">{data.name}</span>
                </div>
                {isWarning && (
                    <Badge variant="destructive" className="text-[9px] font-black animate-pulse shadow-sm">WARNING</Badge>
                )}
            </div>

            {/* Subtitles Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/90 to-transparent pt-8">
                <p className="text-slate-700 text-xs leading-snug line-clamp-2 opacity-90 font-medium bg-slate-50/50 p-1.5 rounded">
                    "{data.transcript}"
                </p>
            </div>

            {/* Hover Action */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                <div className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
                    <Maximize size={12} /> 상세보기
                </div>
            </div>
        </div>
    )
}
