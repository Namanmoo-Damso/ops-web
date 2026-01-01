"use client"

import { useState } from "react"
import {
    ArrowLeft,
    Siren,
    PhoneMissed,
    Activity,
    ArrowDown,
    Save,
    GripVertical,
    Clock,
    AlertTriangle,
    BellRing,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function OperationalRulePage() {
    const router = useRouter()
    
    // --- State Management ---
    const [priorityOrder, setPriorityOrder] = useState([
        { id: 'manager', label: '담당 생활지원사', desc: '가장 먼저 상황 파악' },
        { id: 'guardian', label: '등록된 보호자', desc: '가족에게 즉시 알림' },
        { id: '119', label: '119 응급센터', desc: '최후 수단 연결' },
    ])

    const [retryCount, setRetryCount] = useState(3)
    const [retryInterval, setRetryInterval] = useState(30)
    const [alertThreshold, setAlertThreshold] = useState(24)
    const [sensitivity, setSensitivity] = useState(2)

    const [simulationStep, setSimulationStep] = useState(0)

    const handleSimulation = () => {
        setSimulationStep(0)
        setTimeout(() => setSimulationStep(1), 800)
        setTimeout(() => setSimulationStep(2), 2000)
        setTimeout(() => setSimulationStep(3), 3500)
    }

    const handleFinish = () => {
        router.push("/") // Go to Dashboard
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-sans text-slate-800 flex flex-col">
            
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2</span>
                        <h1 className="text-lg font-black text-foreground">기관 운영 규칙 및 비상 설정</h1>
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
            <main className="flex-1 p-6 md:p-8 flex justify-center overflow-y-auto">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                    
                    {/* [LEFT] Settings Panel (Col-7) */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* 1. Emergency Protocol */}
                        <section className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <Siren size={20} className="text-destructive" />
                                응급 상황 전파 순서 (Protocol)
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                AI가 '살려줘', '낙상' 등 긴급 상황을 감지했을 때 연락할 순서를 지정합니다.
                            </p>
                            
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-border">
                                {priorityOrder.map((item, index) => (
                                    <div key={item.id} className="bg-white p-4 rounded-lg border border-border shadow-sm flex items-center gap-4 group cursor-grab active:cursor-grabbing hover:border-primary transition-colors">
                                        <div className="text-muted-foreground group-hover:text-primary">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground text-sm">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-xs text-center text-muted-foreground mt-2 font-medium">
                                    💡 드래그하여 순서를 변경할 수 있습니다.
                                </p>
                            </div>
                        </section>

                        {/* 2. No-Answer Policy */}
                        <section className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <PhoneMissed size={20} className="text-amber-500" />
                                부재중 재시도 정책
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                전화를 받지 않을 경우 AI의 재시도 로직을 설정합니다.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-2">최대 재시도 횟수</label>
                                    <select 
                                        value={retryCount}
                                        onChange={(e) => setRetryCount(Number(e.target.value))}
                                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:border-primary outline-none"
                                    >
                                        <option value={1}>1회 시도 후 종료</option>
                                        <option value={2}>2회 재시도</option>
                                        <option value={3}>3회 재시도 (권장)</option>
                                        <option value={5}>5회 재시도</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-2">재시도 간격</label>
                                    <select 
                                        value={retryInterval}
                                        onChange={(e) => setRetryInterval(Number(e.target.value))}
                                        className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:border-primary outline-none"
                                    >
                                        <option value={10}>10분 뒤</option>
                                        <option value={30}>30분 뒤 (권장)</option>
                                        <option value={60}>1시간 뒤</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <div className="text-xs text-amber-800">
                                    <strong>고위험 알림 기준:</strong> 재시도가 모두 실패하고 
                                    <span className="font-bold mx-1 text-amber-900 underline">{alertThreshold}시간</span> 
                                    이상 연락이 닿지 않으면 관리자 대시보드에 긴급 알림을 띄웁니다.
                                </div>
                            </div>
                        </section>

                        {/* 3. Sensitivity */}
                        <section className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <Activity size={20} className="text-primary" />
                                AI 위험 감지 민감도
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                사투리나 추임새를 위험 신호로 오인하지 않도록 민감도를 조절합니다.
                            </p>

                            <div className="space-y-6">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="3" 
                                    step="1" 
                                    value={sensitivity}
                                    onChange={(e) => setSensitivity(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                    <span className={sensitivity === 1 ? "text-primary" : ""}>1단계: 둔감<br/><span className="font-normal text-[10px]">(명확한 구조 요청만)</span></span>
                                    <span className={`text-center ${sensitivity === 2 ? "text-primary" : ""}`}>2단계: 표준 (권장)<br/><span className="font-normal text-[10px]">(통증/우울 키워드 포함)</span></span>
                                    <span className={`text-right ${sensitivity === 3 ? "text-primary" : ""}`}>3단계: 민감<br/><span className="font-normal text-[10px]">(작은 신음소리도 감지)</span></span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* [RIGHT] Live Simulation (Col-5) */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-6">
                            <div className="bg-slate-800 rounded-[2.5rem] p-6 shadow-2xl border-4 border-[#2F3E1F] min-h-[600px] flex flex-col">
                                
                                <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                                    <Siren size={18} className="text-red-400 animate-pulse" />
                                    위급 상황 시뮬레이션
                                </h3>
                                <p className="text-slate-400 text-xs mb-6">설정하신 규칙대로 AI가 작동하는지 확인하세요.</p>

                                {/* Simulation Screen */}
                                <div className="bg-[#0F172A] rounded-2xl flex-1 border border-slate-700 p-4 relative overflow-hidden">
                                    
                                    {/* Timeline Line */}
                                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-700" />

                                    <div className="space-y-6 relative">
                                        
                                        {/* Step 0: Event Occur */}
                                        <div className={`flex gap-4 items-start transition-opacity duration-500 ${simulationStep >= 0 ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className="w-4 h-4 rounded-full bg-red-500 mt-1 relative z-10 ring-4 ring-[#0F172A]" />
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm flex-1">
                                                <p className="font-bold text-xs mb-1 text-red-400">[상황 발생]</p>
                                                "아이고.. 가슴이 너무 아파.. 숨을 못 쉬겠어.."
                                            </div>
                                        </div>

                                        {/* Step 1: Detect */}
                                        <div className={`flex gap-4 items-start transition-opacity duration-500 ${simulationStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className="w-4 h-4 rounded-full bg-primary mt-1 relative z-10 ring-4 ring-[#0F172A]" />
                                            <div className="text-slate-300 text-sm flex-1">
                                                <p className="font-bold text-xs mb-1 text-primary">[AI 판단]</p>
                                                위험 키워드 "가슴 아파", "숨 못 쉬어" 감지됨.<br/>
                                                <span className="text-xs text-slate-500">민감도 {sensitivity}단계 기준: <span className="text-red-400 font-bold">즉시 대응 필요</span></span>
                                            </div>
                                        </div>

                                        {/* Step 2: Protocol Execution */}
                                        <div className={`flex gap-4 items-start transition-opacity duration-500 ${simulationStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 relative z-10 ring-4 ring-[#0F172A]" />
                                            <div className="text-slate-300 text-sm flex-1 space-y-2">
                                                <p className="font-bold text-xs mb-1 text-blue-400">[프로토콜 실행]</p>
                                                
                                                {/* Priority 1 */}
                                                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-600">
                                                    <span className="text-xs font-bold bg-slate-700 px-1.5 rounded text-white">1순위</span>
                                                    <span className="text-xs">{priorityOrder[0].label}에게 비상콜</span>
                                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                </div>
                                                
                                                {/* Arrow */}
                                                <div className="flex justify-center"><ArrowDown size={12} className="text-slate-600"/></div>

                                                {/* Priority 2 */}
                                                <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-dashed border-slate-700 opacity-70">
                                                    <span className="text-xs font-bold bg-slate-700 px-1.5 rounded text-slate-400">2순위</span>
                                                    <span className="text-xs text-slate-500">{priorityOrder[1].label} 대기 중</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Step 3: Result */}
                                        <div className={`flex gap-4 items-start transition-opacity duration-500 ${simulationStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className="w-4 h-4 rounded-full bg-white mt-1 relative z-10 ring-4 ring-[#0F172A]" />
                                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-100 text-sm flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BellRing size={14} className="text-green-400" />
                                                    <span className="font-bold text-xs text-green-400">결과 예상</span>
                                                </div>
                                                생활지원사 앱에 <span className="font-bold underline">"긴급 알림(Red Alert)"</span>가 즉시 전송됩니다.
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <button 
                                    onClick={handleSimulation}
                                    className="mt-4 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Clock size={16} /> 설정 테스트 (Re-Run Simulation)
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Fixed Footer */}
            <footer className="bg-white border-t border-slate-200 p-4 md:px-8 h-20 flex items-center justify-between flex-shrink-0 z-20 fixed bottom-0 w-full">
                <Button variant="ghost" className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-slate-100 transition-colors flex items-center gap-2 h-auto" onClick={() => router.back()}>
                    <ArrowLeft size={18} />
                    이전 단계
                </Button>

                <Button 
                    onClick={handleFinish}
                    className="px-8 py-6 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-md bg-slate-800 hover:bg-primary h-auto"
                >
                    <Save size={18} />
                    규칙 저장 및 설정 완료
                    <CheckCircle2 size={18} />
                </Button>
            </footer>
        </div>
    )
}
