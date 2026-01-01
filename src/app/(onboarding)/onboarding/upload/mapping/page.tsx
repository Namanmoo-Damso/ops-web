"use client"

import { useState, useEffect } from "react"
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Wand2,
    FileText,
    ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// --- Mock Data ---
const USER_FILE_HEADERS = [
    { id: "col_0", label: "이름", sample: "홍길동" },
    { id: "col_1", label: "H.P", sample: "010-1234-5678" },
    { id: "col_2", label: "생년월일", sample: "1942-05-08" },
    { id: "col_3", label: "주소(도로명)", sample: "서울시 종로구..." },
    { id: "col_4", label: "비고", sample: "거동 불편" },
    { id: "col_5", label: "담당자", sample: "김복지" },
]

const SYSTEM_FIELDS = [
    { key: "name", label: "어르신 성함", required: true, description: "실명 입력 필수" },
    { key: "phone", label: "휴대폰 번호", required: true, description: "'-' 포함 여부 무관" },
    { key: "birth", label: "생년월일", required: true, description: "YYYY-MM-DD 권장" },
    { key: "address", label: "거주지 주소", required: false, description: "응급 출동 시 사용" },
    { key: "memo", label: "특이사항 메모", required: false, description: "건강 상태 등" },
]

export default function HeaderMatchingPage() {
    const router = useRouter()
    const [mapping, setMapping] = useState<Record<string, string>>({})
    
    // Auto-mapping simulation
    useEffect(() => {
        setMapping({
            name: "col_0",
            phone: "col_1",
            birth: "col_2",
            address: "col_3",
            memo: "col_4"
        })
    }, [])

    const handleSelectChange = (systemKey: string, userHeaderId: string) => {
        setMapping(prev => ({ ...prev, [systemKey]: userHeaderId }))
    }

    const isRequiredSatisfied = SYSTEM_FIELDS.every(field => {
        if (!field.required) return true
        return mapping[field.key] && mapping[field.key] !== ""
    })

    const handleNext = () => {
        router.push("/onboarding/upload/check")
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-sans text-slate-800 flex flex-col">
            
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-muted-foreground hover:bg-slate-100">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1-b</span>
                        <h1 className="text-lg font-black text-foreground">자료 항목 매칭</h1>
                    </div>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 flex justify-center overflow-y-auto pb-32">
                <div className="max-w-4xl w-full flex flex-col gap-6">

                    {/* Instruction Card */}
                    <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                                <Wand2 size={20} className="text-primary" />
                                스마트 매칭이 완료되었습니다.
                            </h2>
                            <p className="text-slate-300 text-sm">
                                업로드하신 파일의 내용을 분석하여 가장 적절한 항목을 자동으로 연결했습니다.<br/>
                                연결이 올바른지 확인 후 수정이 필요하면 변경해 주세요.
                            </p>
                        </div>
                        {/* File Info */}
                        <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/10">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FileText size={20} className="text-primary" />
                            </div>
                            <div className="text-xs">
                                <p className="font-bold text-white">어르신_명단_2024.xlsx</p>
                                <p className="text-slate-400">총 6개 열 / 120명 데이터</p>
                            </div>
                        </div>
                    </div>

                    {/* Mapping Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                        
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-slate-50 border-b border-border py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">
                            <div className="col-span-4">시스템 필요 항목</div>
                            <div className="col-span-1 flex justify-center items-center">
                                <ArrowRight size={14}/>
                            </div>
                            <div className="col-span-7">업로드 파일 항목 선택</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100">
                            {SYSTEM_FIELDS.map((field) => {
                                const selectedHeaderId = mapping[field.key]
                                const selectedHeader = USER_FILE_HEADERS.find(h => h.id === selectedHeaderId)
                                const isMatched = !!selectedHeaderId

                                return (
                                    <div key={field.key} className="grid grid-cols-12 py-5 px-6 items-center hover:bg-[#F7F9F2] transition-colors group">
                                        
                                        {/* Left: System Field */}
                                        <div className="col-span-4 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-bold text-base ${isMatched ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {field.label}
                                                </span>
                                                {field.required ? (
                                                    <span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">필수</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">선택</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{field.description}</p>
                                        </div>

                                        {/* Center: Arrow Icon */}
                                        <div className="col-span-1 flex justify-center">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                                ${isMatched ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-300"}
                                            `}>
                                                {isMatched ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                                            </div>
                                        </div>

                                        {/* Right: User Select */}
                                        <div className="col-span-7 pl-2">
                                            <div className="relative">
                                                <select
                                                    className={`
                                                        w-full appearance-none pl-4 pr-10 py-3.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all outline-none
                                                        ${isMatched 
                                                            ? "border-primary bg-white text-foreground shadow-sm" 
                                                            : "border-slate-200 bg-slate-50 text-muted-foreground hover:border-slate-300"
                                                        }
                                                    `}
                                                    value={selectedHeaderId || ""}
                                                    onChange={(e) => handleSelectChange(field.key, e.target.value)}
                                                >
                                                    <option value="" disabled>파일에서 항목 선택...</option>
                                                    {USER_FILE_HEADERS.map((header) => (
                                                        <option key={header.id} value={header.id}>
                                                            {header.label} (예: {header.sample})
                                                        </option>
                                                    ))}
                                                </select>
                                                
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                    <ChevronDown size={16} strokeWidth={3} />
                                                </div>
                                            </div>

                                            {/* Data Preview */}
                                            {selectedHeader && (
                                                <div className="mt-2 ml-1 flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-1">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-bold">Data Preview</span>
                                                    <span className="text-slate-600 truncate max-w-[200px] font-medium">
                                                        "{selectedHeader.sample}"
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* Fixed Footer Actions */}
            <footer className="bg-white border-t border-slate-200 p-4 md:px-8 h-20 flex items-center justify-between flex-shrink-0 z-20 fixed bottom-0 w-full">
                <Button variant="ghost" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-slate-100 transition-colors flex items-center gap-2 h-auto">
                    <ArrowLeft size={18} />
                    이전 단계
                </Button>

                <div className="flex items-center gap-4">
                    {!isRequiredSatisfied && (
                        <div className="flex items-center gap-2 text-destructive text-sm font-bold animate-pulse">
                            <AlertCircle size={16} />
                            <span>필수 항목을 모두 연결해주세요</span>
                        </div>
                    )}
                    <Button 
                        onClick={handleNext}
                        disabled={!isRequiredSatisfied}
                        className="px-8 py-6 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 transition-all shadow-md h-auto"
                    >
                        데이터 검증 및 미리보기 <ArrowRight size={18} />
                    </Button>
                </div>
            </footer>
        </div>
    )
}
