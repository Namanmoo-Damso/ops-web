"use client"

import {
  Briefcase,
  LayoutDashboard,
  Grid2x2,
  Map,
  Users,
  Phone,
  FileText,
  Settings,
  Search,
  UserPlus,
  MoreHorizontal,
  Smartphone,
  Mail,
  Plus,
  X,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useState } from "react"
import { Sidebar, Header } from "@/components/custom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STAFF_LIST = [
    { id: 1, name: "김복지", team: "방문 1팀", role: "생활지원사", phone: "010-1234-5678", email: "kim@damso.care", assignedCount: 18, maxCapacity: 20, status: "ONLINE", avatarColor: "bg-blue-100 text-blue-600" },
    { id: 2, name: "이성실", team: "방문 1팀", role: "생활지원사", phone: "010-9876-5432", email: "lee@damso.care", assignedCount: 12, maxCapacity: 20, status: "OFFLINE", avatarColor: "bg-emerald-100 text-emerald-600" },
    { id: 3, name: "최열정", team: "방문 2팀", role: "사회복지사", phone: "010-5555-4444", email: "choi@damso.care", assignedCount: 5, maxCapacity: 15, status: "ONLINE", avatarColor: "bg-amber-100 text-amber-600" },
    { id: 4, name: "박신입", team: "방문 2팀", role: "생활지원사", phone: "010-1111-2222", email: "park@damso.care", assignedCount: 0, maxCapacity: 20, status: "PENDING", avatarColor: "bg-slate-100 text-slate-500" },
]

const ELDERLY_POOL = [
    { id: 101, name: "이말순", age: 82, address: "종로구 평창동", assignedTo: 1 }, 
    { id: 102, name: "박철수", age: 79, address: "종로구 구기동", assignedTo: 1 },
    { id: 103, name: "김영희", age: 75, address: "서대문구 홍제동", assignedTo: null }, 
    { id: 104, name: "최정자", age: 88, address: "성북구 정릉동", assignedTo: 2 }, 
    { id: 105, name: "신규분", age: 70, address: "종로구 혜화동", assignedTo: null }, 
]

export default function StaffPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [activePath, setActivePath] = useState("/staff")
    
    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)

    const openAssignModal = (staff: any) => {
        setSelectedStaff(staff)
        setIsAssignModalOpen(true)
    }

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
                
                <Header title="직원 업무 현황 및 배정">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input 
                                placeholder="이름, 팀명 검색" 
                                className="pl-10 w-64 bg-background"
                            />
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 font-bold">
                            <UserPlus size={16} />
                            신규 직원 등록
                        </Button>
                    </div>
                </Header>

                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="총 직원 수" value="12" unit="명" subText="가용 인원 100%" color="bg-slate-800" />
                            <StatCard label="평균 담당 인원" value="15.2" unit="명/인" subText="권장 20명 이하" color="bg-primary" />
                            <StatCard label="미배정 대상자" value="5" unit="명" subText="즉시 배정 필요" color="bg-destructive" isAlert />
                        </div>

                        {/* Staff Grid */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-foreground">직원 목록 ({STAFF_LIST.length})</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8">전체</Button>
                                    <Button variant="outline" size="sm" className="h-8">방문 1팀</Button>
                                    <Button variant="outline" size="sm" className="h-8">방문 2팀</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {STAFF_LIST.map((staff) => (
                                    <StaffCard 
                                        key={staff.id} 
                                        staff={staff} 
                                        onAssign={() => openAssignModal(staff)} 
                                    />
                                ))}
                                {/* Add New Placeholder */}
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="h-full min-h-[220px] bg-transparent border-dashed border-2 rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/50"
                                >
                                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm border">
                                        <Plus size={24} />
                                    </div>
                                    <span className="font-bold text-sm">신규 직원 추가하기</span>
                                </Button>
                            </div>
                        </div>

                    </div>
                </main>

                {/* Add Staff Modal */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>신규 직원 등록</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1.5">이름</label>
                                <Input placeholder="홍길동" className="font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1.5">이메일 (초대장 발송)</label>
                                <Input type="email" placeholder="staff@example.com" className="font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">소속 팀</label>
                                    <Select>
                                        <SelectTrigger className="font-bold">
                                            <SelectValue placeholder="팀 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="team1">방문 1팀</SelectItem>
                                            <SelectItem value="team2">방문 2팀</SelectItem>
                                            <SelectItem value="admin">행정팀</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">직책</label>
                                    <Select>
                                        <SelectTrigger className="font-bold">
                                            <SelectValue placeholder="직책 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manager">생활지원사</SelectItem>
                                            <SelectItem value="social">사회복지사</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>취소</Button>
                            <Button onClick={() => setIsAddModalOpen(false)} className="font-bold">초대 메일 발송</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Assign Modal */}
                <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                            <DialogTitle>담당 어르신 배정</DialogTitle>
                            <p className="text-xs text-muted-foreground">대상 직원: <span className="font-bold text-primary">{selectedStaff?.name}</span> ({selectedStaff?.team})</p>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-hidden flex p-6 gap-6">
                            {/* Left: Available List */}
                            <div className="flex-1 flex flex-col">
                                <h4 className="font-bold text-sm text-foreground mb-2">미배정 / 타담당 어르신</h4>
                                <div className="flex-1 border rounded-xl overflow-y-auto p-2 space-y-1">
                                    {ELDERLY_POOL.filter(e => e.assignedTo !== selectedStaff?.id).map(elder => (
                                        <div key={elder.id} className="p-3 rounded-lg border border-transparent hover:border-primary hover:bg-muted/50 cursor-pointer group flex justify-between items-center transition-all">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{elder.name}</p>
                                                <p className="text-xs text-muted-foreground">{elder.address}</p>
                                            </div>
                                            <Button size="sm" className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                추가 +
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Assigned List */}
                            <div className="flex-1 flex flex-col">
                                <h4 className="font-bold text-sm text-foreground mb-2">
                                    현재 담당 중 ({ELDERLY_POOL.filter(e => e.assignedTo === selectedStaff?.id).length}명)
                                </h4>
                                <div className="flex-1 border border-primary bg-primary/5 rounded-xl overflow-y-auto p-2 space-y-1">
                                    {ELDERLY_POOL.filter(e => e.assignedTo === selectedStaff?.id).map(elder => (
                                        <div key={elder.id} className="p-3 rounded-lg bg-background border shadow-sm flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{elder.name}</p>
                                                <p className="text-xs text-muted-foreground">{elder.address}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-muted/10 flex justify-end gap-3 mt-auto">
                            <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>취소</Button>
                            <Button onClick={() => setIsAssignModalOpen(false)} className="font-bold">변경사항 저장</Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    )
}

function StatCard({ label, value, unit, color, subText, isAlert }: any) {
    return (
        <Card className={`p-5 relative overflow-hidden ${isAlert ? "border-destructive/50" : ""}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color} shadow-md`}>
                    <Briefcase size={20} />
                </div>
                <Badge variant={isAlert ? "destructive" : "secondary"} className="text-[10px]">
                    {subText}
                </Badge>
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black text-foreground tracking-tight">{value}</h3>
                    <span className="text-sm font-bold text-muted-foreground">{unit}</span>
                </div>
            </div>
        </Card>
    )
}

function StaffCard({ staff, onAssign }: any) {
    const usagePercent = (staff.assignedCount / staff.maxCapacity) * 100
    const isOverload = usagePercent >= 90
    
    return (
        <Card className="p-6 hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${staff.avatarColor}`}>
                        {staff.name[0]}
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-lg">{staff.name}</h4>
                        <p className="text-xs text-muted-foreground font-bold">{staff.team} • {staff.role}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal size={20} />
                </Button>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-foreground">
                    <Smartphone size={14} className="text-muted-foreground" />
                    <span className="font-medium">{staff.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail size={14} className="text-muted-foreground" />
                    <span className="font-medium">{staff.email}</span>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-muted-foreground">업무 배정 현황</span>
                    <span className={isOverload ? "text-destructive" : "text-primary"}>
                        {staff.assignedCount} / {staff.maxCapacity}명
                    </span>
                </div>
                <Progress value={usagePercent} className={`h-2 ${isOverload ? 'text-destructive' : 'text-primary'}`} />
            </div>

            <div className="flex gap-2">
                <Button onClick={onAssign} variant="outline" className="flex-1 font-bold gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary">
                    <UserPlus size={16} /> 대상자 배정
                </Button>
            </div>

            {/* Status Indicator */}
            <div className={`absolute top-6 right-12 w-2.5 h-2.5 rounded-full ring-2 ring-white ${staff.status === 'ONLINE' ? 'bg-green-500' : staff.status === 'PENDING' ? 'bg-amber-400' : 'bg-slate-300'}`} />
        </Card>
    )
}
