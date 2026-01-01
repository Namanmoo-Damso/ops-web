"use client"

import {
    Users,
    Settings,
    Phone,
    PlayCircle,
    ArrowRight,
    Sparkles
} from "lucide-react"
import { useState } from "react"
import { SetupCard } from "@/components/custom"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function OnboardIntroPage() {
    const router = useRouter()
    const [completedSteps, setCompletedSteps] = useState<number[]>([])

    const handleStepClick = (stepId: number) => {
        // Toggle completion for demo purposes (Optional behavior from original mockup)
        // In a real app, this would navigate. Let's do both or just Navigate.
        // User objective is migration. 
        if (stepId === 1) router.push("/onboarding/upload")
        if (stepId === 2) router.push("/onboarding/agi")
        // if (stepId === 3) ...
        
        // For UI demo consistency with mockup, let's keep the toggle logic visual 
        // effectively 'simulating' completion if the user wants to see the effect.
        if (completedSteps.includes(stepId)) {
            setCompletedSteps(completedSteps.filter(id => id !== stepId))
        } else {
            setCompletedSteps([...completedSteps, stepId])
        }
    }

    // Overriding the click behavior to prefer navigation if available for step 1 & 2
    // But since pages are empty, maybe just keep toggle for now?
    // User requested order: Login -> Intro -> Upload. 
    // So Step 1 interaction should probably go to Upload page.
    // I will implementation navigation for Step 1 & 2.

    const handleNavigation = (stepId: number) => {
        if (stepId === 1) router.push("/onboarding/upload")
        if (stepId === 2) router.push("/onboarding/agi")
        // Step 3 is just a toggle in mockup usually, or test call trigger
        if (stepId === 3) {
            // Demo toggle for Step 3
             if (completedSteps.includes(3)) {
                setCompletedSteps(completedSteps.filter(id => id !== 3))
            } else {
                setCompletedSteps([...completedSteps, 3])
            }
        }
    }

    const isAllCompleted = completedSteps.length === 3; // Start with 0

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans text-slate-800">
            
            {/* Header */}
            <header className="h-16 bg-white flex items-center justify-between px-8 flex-shrink-0 z-10 shadow-sm border-b border-site-100">
                <div className="flex items-center h-full">
                    <h1 className="text-xl font-black text-primary tracking-tight">담소 Damso</h1>
                </div>
                <div className="flex items-center gap-3">
                     <span className="text-sm font-bold text-muted-foreground hidden md:block">홍길동 관리자님, 환영합니다!</span>
                     <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-emerald-50">
                        홍
                     </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
                
                <div className="max-w-5xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Welcome Section */}
                    <div className="text-center space-y-5">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-primary/20">
                            <Sparkles size={14} className="fill-current" />
                            AI Care Center Ready
                        </div>
                        
                        <h1 className="text-4xl md:text-[2.75rem] font-black text-slate-900 tracking-tight leading-[1.2]">
                            기관 계정 생성이 <br/>
                            성공적으로 완료되었습니다.
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                            이제 AI가 어르신들의 안부를 묻기 위해 몇 가지 준비가 필요합니다.<br/>
                            아래 3가지 단계를 완료하면 <strong className="text-primary">담소 AI 관제 시스템</strong>이 즉시 가동됩니다.
                        </p>
                    </div>

                    {/* Setup Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Step 1: 대상자 등록 */}
                        <SetupCard 
                            step={1}
                            title="대상자 등록"
                            desc="안부 확인이 필요한 어르신 명단을 등록해주세요."
                            icon={Users}
                            iconBgClass="bg-slate-700" 
                            isCompleted={completedSteps.includes(1)}
                            onClick={() => handleNavigation(1)}
                            actionLabel="개별 등록하기"
                            subActionLabel="엑셀 일괄 업로드"
                            onSubAction={(e) => {
                                handleNavigation(1)
                            }}
                        />

                        {/* Step 2: AI 시나리오 설정 */}
                        <SetupCard 
                            step={2}
                            title="AI 시나리오 설정"
                            desc="기관 맞춤형 인사말과 비상 연락망을 설정합니다."
                            icon={Settings}
                            iconBgClass="bg-emerald-600" 
                            isCompleted={completedSteps.includes(2)}
                            onClick={() => handleNavigation(2)}
                            actionLabel="설정 시작하기"
                        />

                        {/* Step 3: 테스트 통화 */}
                        <SetupCard 
                            step={3}
                            title="테스트 통화"
                            desc="AI가 내 휴대폰으로 전화를 걸어 잘 작동하는지 확인합니다."
                            icon={Phone}
                            iconBgClass="bg-amber-600" 
                            isCompleted={completedSteps.includes(3)}
                            onClick={() => handleNavigation(3)}
                            actionLabel="내 폰으로 걸기"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col items-center gap-5 pt-6 pb-10">
                        <button 
                            className={`
                                h-[68px] px-16 rounded-2xl text-lg font-bold tracking-wide text-white transition-all flex items-center gap-2 shadow-sm
                                ${isAllCompleted 
                                    ? 'bg-primary hover:bg-primary/90 shadow-emerald-100 shadow-xl cursor-pointer transform hover:-translate-y-1' 
                                    : 'bg-slate-300 cursor-not-allowed'
                                }
                            `}
                            disabled={!isAllCompleted}
                            onClick={() => router.push("/")}
                        >
                            대시보드로 이동하기 <ArrowRight size={20} strokeWidth={3}/>
                        </button>

                        <button className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 underline decoration-slate-300 underline-offset-4 transition-colors">
                            <PlayCircle size={14}/>
                            데이터가 없습니다. 샘플 데이터로 대시보드 미리보기
                        </button>
                    </div>

                </div>
            </main>
        </div>
    )
}
