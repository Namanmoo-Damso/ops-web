"use client"

import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Phone,
  Briefcase,
  History,
  User,
  Stethoscope,
  Pill,
  Clock,
  PenTool,
  ArrowLeft,
  Save,
  LayoutDashboard,
  Grid2x2,
  Map as MapIcon,
  FileText,
  Settings,
  Users,
  StickyNote
} from "lucide-react"
import { useState } from "react"
import { Sidebar, Header } from "@/components/custom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
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
import { Textarea } from "@/components/ui/textarea"

// --- Mock Data ---
const BENEFICIARIES = [
    { 
        id: 1, name: "이말순", age: 82, gender: "여", type: "독거", 
        address: "서울시 종로구 평창동 12-3", manager: "김복지", 
        phoneNumber: "010-1234-1111", notes: "거동이 불편하여 방문 시 초인종을 길게 눌러주세요. 강아지를 키우고 계십니다.",
        status: "WARNING", lastCall: "오늘 14:30", 
        diseases: ["고혈압", "협심증"], medication: "혈압약 (아침/저녁)",
        guardian: "아들 박성훈 (010-1234-5678)",
        recentLogs: [
            { date: "오늘 14:30", type: "AI 안부", content: "가슴 통증 호소 (위험 감지)", sentiment: "negative", id: 1 },
            { date: "5/07 10:00", type: "정기 방문", content: "반찬 배달 및 청소 지원", sentiment: "neutral", writer: "김복지", id: 2 },
            { date: "5/06 14:00", type: "AI 안부", content: "식사 잘 하심, 기분 좋음", sentiment: "positive", id: 3 }
        ]
    },
    { 
        id: 2, name: "박철수", age: 79, gender: "남", type: "부부", 
        address: "서울시 종로구 구기동 88", manager: "이성실", 
        phoneNumber: "010-9876-2222", notes: "난청이 있으셔서 크게 말씀해드려야 합니다.",
        status: "NORMAL", lastCall: "어제 10:00", 
        diseases: ["관절염"], medication: "진통제 (필요시)",
        guardian: "딸 박지민 (010-9876-5432)",
        recentLogs: [
            { date: "어제 10:00", type: "AI 안부", content: "복지관 다녀오심", sentiment: "positive", id: 1 }
        ]
    },
    { 
        id: 3, name: "최정자", age: 88, gender: "여", type: "독거", 
        address: "서울시 성북구 정릉동 33", manager: "최열정", 
        phoneNumber: "010-3333-3333", notes: "특별한 특이사항 없음.",
        status: "CAUTION", lastCall: "5/05 11:00", 
        diseases: ["우울증", "불면증"], medication: "수면제",
        guardian: "손자 이민호 (010-3333-4444)",
        recentLogs: [
            { date: "5/05 11:00", type: "AI 안부", content: "외로움 호소", sentiment: "negative", id: 1 }
        ]
    },
    { id: 4, name: "김영희", age: 75, gender: "여", type: "독거", address: "서대문구 홍제동", manager: "김복지", phoneNumber: "010-4444-4444", notes: "-", status: "NORMAL", lastCall: "오늘 09:30", diseases: ["당뇨"], medication: "인슐린", guardian: "조카 (010-0000-0000)", recentLogs: [] },
    { id: 5, name: "정민수", age: 72, gender: "남", type: "독거", address: "은평구 불광동", manager: "박관리", phoneNumber: "010-5555-5555", notes: "-", status: "NORMAL", lastCall: "오늘 10:00", diseases: ["-"], medication: "-", guardian: "-", recentLogs: [] },
    { id: 6, name: "강동원", age: 81, gender: "남", type: "부부", address: "종로구 신영동", manager: "김복지", phoneNumber: "010-6666-6666", notes: "-", status: "NORMAL", lastCall: "오늘 11:00", diseases: ["고지혈증"], medication: "약 복용 중", guardian: "배우자", recentLogs: [] },
    { id: 7, name: "윤여정", age: 74, gender: "여", type: "독거", address: "종로구 혜화동", manager: "최열정", phoneNumber: "010-7777-7777", notes: "-", status: "NORMAL", lastCall: "어제 15:00", diseases: ["-"], medication: "-", guardian: "아들", recentLogs: [] },
]

export default function BeneficiaryListPage() {
    const [isSidebarOpen] = useState(true)
    const [selectedUser, setSelectedUser] = useState<any>(null) 
    const [activePath, setActivePath] = useState("/users")
    
    // Log Modal States
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [logViewMode, setLogViewMode] = useState<'LIST' | 'WRITE'>('LIST')

    const [filter, setFilter] = useState<'ALL' | 'RISK'>('ALL')
    const [searchTerm, setSearchTerm] = useState("")

    const filteredList = BENEFICIARIES.filter(user => {
        const matchesFilter = filter === 'ALL' || (filter === 'RISK' && (user.status === 'WARNING' || user.status === 'CAUTION'));
        const matchesSearch = user.name.includes(searchTerm) || user.address.includes(searchTerm);
        return matchesFilter && matchesSearch;
    })

    const openLogModal = () => {
        setLogViewMode('LIST')
        setIsLogModalOpen(true)
    }

    // Navigation Items
    const navItems = [
        { icon: LayoutDashboard, label: "대시보드 홈", path: "/dashboard" },
        { icon: Grid2x2, label: "모니터링 뷰", path: "/monitoring", badge: "LIVE" },
        { icon: MapIcon, label: "지도 뷰", path: "/map" },
        { icon: Users, label: "전체 대상자 관리", path: "/users" },
        { icon: Briefcase, label: "직원 관리", path: "/staff" },
        { icon: Phone, label: "통화 기록", path: "/calls" },
        { icon: FileText, label: "리포트 & 통계", path: "/report" },
    ]

    const bottomNavItems = [
        { icon: Settings, label: "설정", path: "/settings" },
    ]

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                
                {/* Header */}
                <Header 
                  title="전체 대상자 관리" 
                  notificationCount={2}
                  userInitial="박"
                >
                    <div className="flex items-center gap-3">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input 
                                placeholder="이름, 주소 검색" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64 bg-background"
                            />
                        </div>

                        <div className="flex bg-muted p-1 rounded-lg">
                            <button 
                                onClick={() => setFilter('ALL')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                            >
                                전체
                            </button>
                            <button 
                                onClick={() => setFilter('RISK')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filter === 'RISK' ? 'bg-red-50 text-red-500 shadow-sm' : 'text-muted-foreground'}`}
                            >
                                위험군
                            </button>
                        </div>

                        <Button className="gap-2">
                            <Plus size={16} />
                            대상자 등록
                        </Button>
                    </div>
                </Header>

                {/* List Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <Card className="rounded-2xl shadow-sm overflow-hidden border-none ring-1 ring-slate-200">
                        <Table>
                            <TableHeader className="bg-white">
                                <TableRow className="hover:bg-white border-b border-slate-100">
                                    <TableHead className="font-bold pl-8 w-[30%] h-12 text-slate-500">이름 / 기본정보</TableHead>
                                    <TableHead className="font-bold h-12 text-slate-500">현재 상태</TableHead>
                                    <TableHead className="font-bold h-12 text-slate-500">거주지</TableHead>
                                    <TableHead className="font-bold h-12 text-slate-500">담당자</TableHead>
                                    <TableHead className="font-bold h-12 text-slate-500">최근 안부</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white">
                                {filteredList.map((user) => (
                                    <TableRow 
                                        key={user.id} 
                                        onClick={() => setSelectedUser(user)}
                                        className={`cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-50/80 ${selectedUser?.id === user.id ? 'bg-slate-50' : ''}`}
                                    >
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${user.status === 'WARNING' ? 'bg-red-500' : 'bg-slate-400'}`}>
                                                    {user.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base mb-0.5">{user.name}</p>
                                                    <Badge variant="outline" className="text-[10px] text-slate-500 font-normal h-5 px-1.5 border-slate-200 bg-slate-50">
                                                        {user.age}세 / {user.gender} / {user.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.status === 'WARNING' ? (
                                                <Badge variant="destructive" className="gap-1.5 pl-1.5 pr-2.5 py-1">
                                                    <AlertTriangle size={12} /> 위험 감지
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1.5 pl-1.5 pr-2.5 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100">
                                                    <CheckCircle2 size={12} /> 상태 양호
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-medium truncate max-w-[200px]">{user.address}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {user.manager[0]}
                                                </div>
                                                <span className="text-slate-600 font-bold text-sm">{user.manager}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-medium">{user.lastCall}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </main>

                {/* Detail Modal (Wider Dialog, Updated Content) */}
                <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogContent className="max-w-8xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                        {selectedUser && (
                            <>
                                {/* Header */}
                                <DialogHeader className="px-8 py-6 border-b bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md ${selectedUser.status === 'WARNING' ? 'bg-red-500' : 'bg-slate-400'}`}>
                                            {selectedUser.name[0]}
                                        </div>
                                        <div className="text-left">
                                            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-1">
                                                {selectedUser.name} 
                                                <span className="text-base font-medium text-slate-400">({selectedUser.age}세 / {selectedUser.gender})</span>
                                            </DialogTitle>
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Badge variant={selectedUser.status === 'WARNING' ? 'destructive' : 'secondary'} className="h-6">
                                                    {selectedUser.status === 'WARNING' ? '케어 필요 (Warning)' : '안정적 (Normal)'}
                                                </Badge>
                                                <span className="text-slate-400">|</span>
                                                <span className="text-slate-500">{selectedUser.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Actions in Header (Moved 'History' button here or separate?) */}
                                    {/* User asked to remove 'Call' button. We can keep History button prominent or in grid. */}
                                    {/* Let's put History button in top right for quick access */}
                                    <Button 
                                        variant="outline" 
                                        className="gap-2 font-bold text-slate-600 border-slate-200 hover:bg-white bg-white shadow-sm" 
                                        onClick={openLogModal}
                                    >
                                        <History size={16} /> 담소일지 (상담기록)
                                    </Button>
                                </DialogHeader>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Column: Basic Info & Notes */}
                                        <div className="space-y-6">
                                            
                                            {/* Basic Info */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                                    <User size={16} className="text-slate-400" /> 기본 정보
                                                </h4>
                                                <Card className="bg-slate-50/50 rounded-xl p-5 space-y-4 border-slate-100 shadow-sm">
                                                    <InfoRow icon={Phone} label="대상자 전화번호" value={selectedUser.phoneNumber} />
                                                    <InfoRow icon={MapPin} label="주소" value={selectedUser.address} />
                                                    <InfoRow icon={User} label="보호자" value={selectedUser.guardian} />
                                                    <InfoRow icon={Briefcase} label="담당자" value={selectedUser.manager} />
                                                </Card>
                                            </div>

                                            {/* Notes (New Section) */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                                    <StickyNote size={16} className="text-slate-400" /> 참고사항 (특이사항)
                                                </h4>
                                                <Card className="bg-amber-50/50 rounded-xl p-5 border-amber-100 shadow-sm">
                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {selectedUser.notes}
                                                    </p>
                                                </Card>
                                            </div>
                                        </div>

                                        {/* Right Column: Health */}
                                        <div className="space-y-6">
                                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                                <Stethoscope size={16} className="text-slate-400" /> 건강 정보
                                            </h4>
                                            <div className="space-y-3">
                                                <Card className="p-5 flex items-start gap-4 border-slate-100 shadow-sm">
                                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"><Stethoscope size={20}/></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase">기저질환</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {selectedUser.diseases.map((d:string) => (
                                                                <Badge key={d} variant="outline" className="text-xs border-slate-200 bg-slate-50 font-bold text-slate-600 px-2 py-0.5">{d}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Card>
                                                <Card className="p-5 flex items-start gap-4 border-slate-100 shadow-sm">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Pill size={20}/></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase">복약 정보</p>
                                                        <p className="text-sm font-bold text-slate-700">{selectedUser.medication}</p>
                                                    </div>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
                                    <Button variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold">
                                        대상자 삭제
                                    </Button>
                                    <Button variant="outline" className="font-bold border-slate-200 bg-white">
                                        정보 수정
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Log Modal (Nested Dialog) */}
                <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 z-[60]"> 
                        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                            <div className="flex items-center gap-3">
                                {logViewMode === 'WRITE' ? (
                                    <Button variant="ghost" size="icon" onClick={() => setLogViewMode('LIST')} className="h-8 w-8">
                                        <ArrowLeft size={16} />
                                    </Button>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary font-bold">
                                        <History size={20} />
                                    </div>
                                )}
                                <div>
                                    <DialogTitle>
                                        {logViewMode === 'LIST' ? '담소일지 및 상담 이력' : '새 담소일지 작성'}
                                    </DialogTitle>
                                    <p className="text-xs text-muted-foreground">대상자: <span className="font-bold text-primary">{selectedUser?.name}</span></p>
                                </div>
                            </div>
                        </DialogHeader>

                        {logViewMode === 'LIST' ? (
                            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                        <Clock size={16} /> 최근 기록 ({selectedUser?.recentLogs.length}건)
                                    </h4>
                                    <Button onClick={() => setLogViewMode('WRITE')} className="gap-2 font-bold">
                                        <PenTool size={14} /> 새 일지 작성
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {selectedUser?.recentLogs.map((log: any) => (
                                        <Card key={log.id} className="p-4 flex gap-4 hover:border-primary transition-colors cursor-pointer group">
                                            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold
                                                ${log.type === 'AI 안부' ? 'bg-primary' : 'bg-slate-700'}`}>
                                                {log.type === 'AI 안부' ? 'AI' : <User size={16}/>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm">{log.type}</span>
                                                        {log.writer && <Badge variant="outline" className="text-[10px] py-0 h-5">by {log.writer}</Badge>}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{log.date}</span>
                                                </div>
                                                
                                                <div className="bg-muted/30 p-3 rounded-lg border mt-1">
                                                    <p className="text-sm text-foreground leading-relaxed font-medium">
                                                        "{log.summary || log.content}"
                                                    </p>
                                                </div>

                                                {log.sentiment && (
                                                    <div className="mt-2 flex gap-2">
                                                        <Badge variant={log.sentiment === 'negative' ? 'destructive' : log.sentiment === 'positive' ? 'default' : 'secondary'} className="text-[10px]">
                                                            {log.sentiment === 'negative' ? '위험 감지' : log.sentiment === 'positive' ? '기분 좋음' : '특이사항 없음'}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Write Form
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="bg-muted/30 border rounded-xl p-4 flex gap-3 items-start opacity-80">
                                    <div className="mt-0.5 text-primary"><History size={16} /></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-muted-foreground mb-1">참고: 가장 최근 AI 대화 요약</p>
                                        <p className="text-sm font-medium">"{selectedUser?.recentLogs[0]?.summary || '기록 없음'}"</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-1.5">작성일시</label>
                                            <Input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="font-bold bg-muted/30" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-1.5">활동 유형</label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="활동 유형 선택" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="visit">정기 방문</SelectItem>
                                                    <SelectItem value="call">유선 상담 (전화)</SelectItem>
                                                    <SelectItem value="emergency">긴급 출동</SelectItem>
                                                    <SelectItem value="delivery">물품 전달</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">상담/관찰 내용</label>
                                        <Textarea 
                                            className="h-40 resize-none" 
                                            placeholder="어르신의 건강 상태, 식사 여부, 특이사항 등을 기록해주세요." 
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">태그 (선택)</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['건강호전', '건강악화', '병원동행필요', '물품지원요청', '정서안정', '식사거부'].map(tag => (
                                                <Button key={tag} variant="outline" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary hover:border-primary">
                                                    #{tag}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {logViewMode === 'WRITE' && (
                            <div className="p-6 border-t bg-muted/10 flex justify-end gap-3 mt-auto">
                                <Button variant="ghost" onClick={() => setLogViewMode('LIST')}>취소</Button>
                                <Button onClick={() => setIsLogModalOpen(false)} className="gap-2 font-bold">
                                    <Save size={18} /> 저장하기
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

function InfoRow({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-start gap-3">
            <Icon size={16} className="text-slate-400 mt-0.5" />
            <div className="flex-1">
                <p className="text-xs font-bold text-slate-400">{label}</p>
                <p className="text-sm font-bold break-keep text-slate-700">{value}</p>
            </div>
        </div>
    )
}
