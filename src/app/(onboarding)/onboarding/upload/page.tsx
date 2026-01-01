"use client"

import { useState, useRef } from "react"
import {
    UploadCloud,
    FileSpreadsheet,
    X,
    Download,
    CheckCircle2,
    ArrowRight,
    AlertCircle,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ExcelUploadPage() {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => {
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = (selectedFile: File) => {
        setIsUploading(true)
        setTimeout(() => {
            setFile(selectedFile)
            setIsUploading(false)
        }, 1500)
    }

    const removeFile = () => {
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleNext = () => {
        router.push("/onboarding/upload/mapping")
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
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1-a</span>
                        <h1 className="text-lg font-black text-foreground">대상자 명단 업로드</h1>
                    </div>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 flex justify-center overflow-y-auto">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
                    
                    {/* [LEFT] Upload Area */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col min-h-[400px]">
                            <h2 className="text-xl font-bold text-foreground mb-2">파일 불러오기</h2>
                            <p className="text-muted-foreground text-sm mb-6">보유하고 계신 엑셀 파일(.xlsx, .csv)을 이곳에 끌어다 놓으세요.</p>

                            {/* Drop Zone */}
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => !file && fileInputRef.current?.click()}
                                className={`
                                    flex-1 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center p-10 cursor-pointer relative overflow-hidden
                                    ${isDragging 
                                        ? "border-primary bg-primary/5" 
                                        : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
                                    }
                                    ${file ? "bg-white border-slate-200 cursor-default" : ""}
                                `}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx, .xls, .csv" 
                                    onChange={onFileSelect}
                                />

                                {/* Case 1: Upload Ready */}
                                {!file && !isUploading && (
                                    <>
                                        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm mb-6 border">
                                            <UploadCloud size={40} className="text-primary" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-700 mb-2 text-center">
                                            파일을 드래그하거나 클릭하여 선택
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            최대 50MB · .xlsx, .csv 지원
                                        </p>
                                    </>
                                )}

                                {/* Case 2: Uploading */}
                                {isUploading && (
                                    <div className="text-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin mx-auto mb-4"/>
                                        <p className="font-bold text-slate-600">파일을 안전하게 암호화하여 업로드 중...</p>
                                    </div>
                                )}

                                {/* Case 3: File Selected */}
                                {file && !isUploading && (
                                    <div className="w-full max-w-md bg-white border border-border rounded-xl p-4 shadow-sm flex items-center gap-4 relative animate-in fade-in slide-in-from-bottom-2">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{file.name}</p>
                                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · 업로드 완료</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                            className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                        
                                        <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full p-1 border-4 border-white">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Debug Helper */}
                            <button 
                                onClick={() => handleFile(new File(["dummy content"], "sample_data_2025.xlsx"))}
                                className="text-xs text-slate-400 underline hover:text-primary self-center"
                            >
                                [Test] Load Sample File
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => router.back()} className="px-6 py-6 rounded-xl font-bold h-auto">
                                취소
                            </Button>
                            <Button 
                                onClick={handleNext}
                                disabled={!file}
                                className="px-8 py-6 rounded-xl font-bold h-auto gap-2 bg-slate-800 hover:bg-slate-900"
                            >
                                다음 단계로 (헤더 매칭) <ArrowRight size={18} />
                            </Button>
                        </div>
                    </div>


                    {/* [RIGHT] Guide Area */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Download Card */}
                        <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                            
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <FileSpreadsheet size={20} className="text-primary" />
                                전용 양식 다운로드
                            </h3>
                            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                데이터 오류를 방지하기 위해<br/>
                                담소 표준 양식을 사용하여 작성해 주세요.
                            </p>
                            
                            <Button variant="secondary" className="w-full font-bold gap-2 hover:bg-primary/20 hover:text-primary-foreground transition-colors">
                                <Download size={16} />
                                엑셀 템플릿 받기
                            </Button>
                        </div>

                        {/* Checklist Card */}
                        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <AlertCircle size={18} className="text-primary" />
                                작성 시 유의사항
                            </h3>
                            <ul className="space-y-4">
                                <CheckItem 
                                    title="필수 입력 정보" 
                                    desc="성함, 연락처(휴대폰), 생년월일은 반드시 포함되어야 합니다." 
                                />
                                <CheckItem 
                                    title="개인정보 보호" 
                                    desc="주민번호 뒷자리는 수집하지 않습니다. 생년월일 6자리만 입력해주세요." 
                                />
                                <CheckItem 
                                    title="중복 확인" 
                                    desc="동일한 연락처가 중복되어 있는지 확인해주세요." 
                                />
                            </ul>
                        </div>

                        {/* Help Contact */}
                        <div className="text-center p-4">
                            <p className="text-xs text-muted-foreground font-medium">
                                엑셀 파일 업로드에 문제가 있으신가요?<br/>
                                <Link href="#" className="underline decoration-slate-300 hover:text-foreground">기술지원팀에 문의하기</Link>
                            </p>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

function CheckItem({ title, desc }: { title: string, desc: string }) {
    return (
        <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 size={12} className="text-primary" />
            </div>
            <div>
                <p className="text-sm font-bold text-foreground mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
            </div>
        </li>
    )
}
