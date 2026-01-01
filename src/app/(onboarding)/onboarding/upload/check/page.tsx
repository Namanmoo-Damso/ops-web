"use client"

import { useState } from "react"
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    FileCheck,
    Users,
    AlertCircle,
    Download,
    Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// --- Mock Data ---
const PREVIEW_DATA = [
    { id: 1, name: "홍길동", phone: "010-1234-5678", birth: "1942-05-08", address: "서울시 종로구", status: "VALID", msg: "정상" },
    { id: 2, name: "김철수", phone: "010-9876-5432", birth: "1939-12-25", address: "서울시 중구", status: "VALID", msg: "정상" },
    { id: 3, name: "이영희", phone: "010-1111-2222", birth: "1945-08-15", address: "경기도 수원시", status: "VALID", msg: "정상" },
    { id: 4, name: "박민수", phone: "", birth: "1950-01-01", address: "인천시 남동구", status: "ERROR", msg: "필수값 누락 (연락처)" },
    { id: 5, name: "최자영", phone: "010-3333-4444", birth: "450505", address: "서울시 강남구", status: "WARNING", msg: "생년월일 형식 변환됨" },
    { id: 6, name: "정수빈", phone: "010-5555-6666", birth: "1948-03-01", address: "부산시 해운대구", status: "VALID", msg: "정상" },
    { id: 7, name: "강동원", phone: "010-1234-5678", birth: "1940-07-07", address: "서울시 용산구", status: "ERROR", msg: "중복된 연락처" },
]

export default function DataValidationPage() {
    const [showErrorsOnly, setShowErrorsOnly] = useState(false)
    const router = useRouter()

    const totalCount = PREVIEW_DATA.length
    const errorCount = PREVIEW_DATA.filter(d => d.status === "ERROR").length
    const successCount = totalCount - errorCount

    const filteredData = showErrorsOnly 
        ? PREVIEW_DATA.filter(d => d.status !== "VALID") 
        : PREVIEW_DATA

    const handleComplete = () => {
        router.push("/onboarding/invite")
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
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1-c</span>
                        <h1 className="text-lg font-black text-foreground">데이터 검증 및 완료</h1>
                    </div>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 flex justify-center overflow-y-auto pb-32">
                <div className="max-w-6xl w-full flex flex-col gap-6">

                    {/* 1. Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            label="총 업로드 건수" 
                            count={totalCount} 
                            icon={FileCheck} 
                            colorClass="text-slate-600 bg-slate-100" 
                        />
                        <StatCard 
                            label="등록 가능 (정상)" 
                            count={successCount} 
                            icon={CheckCircle2} 
                            colorClass="text-primary bg-primary/10" 
                        />
                        <StatCard 
                            label="등록 불가 (오류)" 
                            count={errorCount} 
                            icon={AlertTriangle} 
                            colorClass="text-destructive bg-destructive/10" 
                            isError={errorCount > 0}
                        />
                    </div>

                    {/* 2. Validation Message & Filters */}
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className={`mt-1 ${errorCount > 0 ? "text-destructive" : "text-primary"}`} size={20} />
                            <div>
                                <h3 className="font-bold text-foreground">
                                    {errorCount > 0 
                                        ? `${errorCount}건의 데이터에 오류가 발견되었습니다.` 
                                        : "모든 데이터가 정상입니다."}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {errorCount > 0 
                                        ? "오류가 있는 항목은 등록에서 제외되거나 수정이 필요합니다." 
                                        : "아래 버튼을 눌러 대상자 등록을 완료해주세요."}
                                </p>
                            </div>
                        </div>

                        {/* Filter Toggle */}
                        <Button 
                            variant={showErrorsOnly ? "default" : "outline"}
                            onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                            className={`gap-2 ${showErrorsOnly ? "bg-slate-800" : ""}`}
                        >
                            <Filter size={16} />
                            {showErrorsOnly ? "전체 데이터 보기" : "오류 항목만 보기"}
                        </Button>
                    </div>

                    {/* 3. Data Preview Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex-1 min-h-[400px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-border text-xs font-black text-slate-500 uppercase tracking-wider">
                                        <th className="p-4 w-32">상태</th>
                                        <th className="p-4">어르신 성함</th>
                                        <th className="p-4">연락처</th>
                                        <th className="p-4">생년월일</th>
                                        <th className="p-4">주소</th>
                                        <th className="p-4">검증 메시지</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredData.map((row) => (
                                        <tr key={row.id} className="hover:bg-[#F7F9F2] transition-colors">
                                            <td className="p-4">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="p-4 font-bold text-foreground">{row.name}</td>
                                            <td className={`p-4 ${!row.phone && "bg-destructive/10"}`}>
                                                {row.phone || <span className="text-destructive text-xs font-bold">(누락)</span>}
                                            </td>
                                            <td className="p-4 text-muted-foreground">{row.birth}</td>
                                            <td className="p-4 text-muted-foreground truncate max-w-[200px]">{row.address}</td>
                                            <td className="p-4 text-sm font-medium">
                                                <span className={`
                                                    ${row.status === "ERROR" ? "text-destructive" : ""}
                                                    ${row.status === "WARNING" ? "text-amber-500" : ""}
                                                    ${row.status === "VALID" ? "text-slate-400" : ""}
                                                `}>
                                                    {row.msg}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-10 text-center text-muted-foreground">
                                                데이터가 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Download Error Report Link */}
                    {errorCount > 0 && (
                        <div className="flex justify-end">
                            <button className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 underline decoration-slate-300 underline-offset-4">
                                <Download size={14} />
                                오류 리포트 다운로드 (Excel)
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Fixed Footer */}
            <footer className="bg-white border-t border-slate-200 p-4 md:px-8 h-20 flex items-center justify-between flex-shrink-0 z-20 fixed bottom-0 w-full">
                <Button variant="ghost" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-slate-100 transition-colors flex items-center gap-2 h-auto">
                    <ArrowLeft size={18} />
                    이전 단계
                </Button>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-muted-foreground">
                        총 {successCount}명 등록 예정
                    </span>
                    <Button 
                        onClick={handleComplete}
                        className="px-8 py-6 rounded-xl font-bold bg-slate-800 hover:bg-primary text-white flex items-center gap-2 transition-all shadow-md h-auto"
                    >
                        <Users size={18} />
                        대상자 등록 완료하기
                    </Button>
                </div>
            </footer>
        </div>
    )
}

function StatCard({ label, count, icon: Icon, colorClass, isError }: any) {
    return (
        <div className={`bg-white p-6 rounded-2xl border ${isError ? "border-destructive/30 shadow-destructive/10" : "border-border"} shadow-sm flex items-center justify-between`}>
            <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-black text-foreground">{count}<span className="text-sm text-slate-400 ml-1">건</span></h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon size={24} />
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === "VALID") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0F5E8] text-[#4A5D23] text-xs font-black uppercase tracking-tight">
                <CheckCircle2 size={12} /> 정상
            </span>
        )
    }
    if (status === "WARNING") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-xs font-black uppercase tracking-tight">
                <AlertCircle size={12} /> 주의
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-destructive text-xs font-black uppercase tracking-tight">
            <AlertTriangle size={12} /> 오류
        </span>
    )
}
