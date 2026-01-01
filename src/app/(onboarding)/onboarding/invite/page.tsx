"use client"

import { useState } from "react"
import {
    ArrowLeft,
    Send,
    MessageCircle,
    CheckCircle2,
    Zap,
    Clock,
    ArrowRight,
    Users
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function InvitePage() {
    const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'complete'>('idle')
    const router = useRouter()

    const handleSendInvites = () => {
        setSendingState('sending')
        setTimeout(() => {
            setSendingState('complete')
        }, 2500)
    }

    const handleNext = () => {
        router.push("/onboarding/agi")
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-sans text-slate-800 flex flex-col">
            
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2</span>
                        <h1 className="text-lg font-black text-foreground">앱 설치 초대 발송</h1>
                    </div>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 flex justify-center overflow-y-auto">
                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    
                    {/* [LEFT] Phone Mockup (Message Preview) */}
                    <div className="order-2 lg:order-1 flex justify-center lg:justify-end">
                        <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] shadow-2xl border-8 border-slate-900 overflow-hidden ring-1 ring-slate-950/50">
                            {/* Status Bar */}
                            <div className="absolute top-0 w-full h-8 bg-white flex justify-between px-6 items-center z-10 text-[10px] font-bold">
                                <span>SKT</span>
                                <div className="w-16 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 -top-1" />
                                <span>100%</span>
                            </div>

                            {/* App Screen: KakaoTalk Chat Room */}
                            <div className="w-full h-full bg-[#BACEE0] pt-12 flex flex-col">
                                {/* Chat Header */}
                                <div className="bg-[#BACEE0] px-4 pb-2 flex items-center gap-2 border-b border-slate-300/10">
                                    <ArrowLeft size={18} className="text-slate-700"/>
                                    <span className="text-sm font-bold text-slate-700">담소(Damso) 알림톡</span>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    <div className="flex flex-col gap-1 items-center">
                                        <span className="text-[10px] bg-slate-900/10 text-white px-2 py-0.5 rounded-full">
                                            2025년 5월 8일 월요일
                                        </span>
                                    </div>

                                    {/* The Message Bubble */}
                                    <div className="flex gap-2 items-start animate-in slide-in-from-bottom-4 duration-700">
                                        <div className="w-9 h-9 rounded-[14px] bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {/* Damso Logo Placeholder */}
                                            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-xs">담</div>
                                        </div>
                                        <div className="flex flex-col gap-1 max-w-[220px]">
                                            <span className="text-[11px] text-slate-500 font-bold ml-1">담소 Care</span>
                                            <div className="bg-white rounded-xl p-3 shadow-sm text-sm text-slate-800 relative">
                                                <p className="font-bold mb-2 text-primary">
                                                    [담소] 김철수님, 안녕하세요!
                                                </p>
                                                <p className="text-xs leading-relaxed text-slate-600 mb-3">
                                                    어르신의 건강하고 즐거운 하루를 위해 '담소' 서비스가 시작되었습니다.
                                                    <br/><br/>
                                                    아래 버튼을 눌러 앱을 설치하고, 
                                                    <span className="bg-[#FAE100] px-1 rounded mx-0.5 font-bold">카카오로 시작하기</span>
                                                    를 누르시면 자동으로 연결됩니다.
                                                </p>
                                                
                                                {/* Action Button inside Bubble */}
                                                <div className="bg-[#F5F7FA] rounded-lg p-3 text-center border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                                                    <span className="text-xs font-bold text-slate-700">앱 설치하고 시작하기</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Input Area (Fake) */}
                                <div className="h-12 bg-white flex items-center px-2 justify-between">
                                    <div className="w-6 h-6 bg-slate-200 rounded text-slate-400 flex items-center justify-center"><PlusIcon /></div>
                                    <div className="flex-1 h-8 bg-slate-100 rounded-full mx-2" />
                                    <div className="w-6 h-6 bg-[#FAE100] rounded text-slate-800 flex items-center justify-center"><Send size={12}/></div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* [RIGHT] Controls & Info */}
                    <div className="order-1 lg:order-2 space-y-8">
                        
                        {/* 1. Success Message */}
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0F5E8] text-[#4A5D23] rounded-full text-xs font-bold uppercase tracking-wider border border-[#C2D5A8]">
                                <CheckCircle2 size={14} />
                                Step 1 Registration Completed
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                                <span className="text-primary">{120}명</span>의 대상자가<br/>
                                정상적으로 등록되었습니다.
                            </h2>
                            <p className="text-slate-500 text-lg">
                                이제 어르신들의 휴대폰으로 앱 설치 초대장을 발송하여<br/>
                                계정을 연결할 차례입니다.
                            </p>
                        </div>

                        {/* 2. Technical Explanation Card */}
                        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-[#4A5D23] flex items-center gap-2 mb-3">
                                <Zap size={18} className="fill-[#8FA963] text-primary" />
                                자동 연결(Auto-Link) 기술 적용됨
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">1</span>
                                    <span>어르신이 문자/카톡의 <strong>링크를 클릭</strong>하여 앱을 설치합니다.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">2</span>
                                    <span>앱 실행 후 <strong>[카카오로 시작하기]</strong> 버튼만 누르면 됩니다.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-[#E6F4ED] flex items-center justify-center font-bold text-xs text-primary shrink-0">3</span>
                                    <span><strong>전화번호가 자동 매칭</strong>되어 별도 가입 절차가 필요 없습니다.</span>
                                </li>
                            </ul>
                        </div>

                        {/* 3. Action Buttons */}
                        {sendingState === 'complete' ? (
                            // [Case] 발송 완료 시
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="bg-slate-800 text-white rounded-2xl p-6 text-center shadow-lg">
                                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">초대장 발송 완료!</h3>
                                    <p className="text-slate-300 text-sm mb-6">
                                        120건의 알림톡이 순차적으로 발송되고 있습니다.
                                    </p>
                                    <button 
                                        onClick={handleNext}
                                        className="w-full py-3 bg-white text-slate-800 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        다음 단계 (AI 설정) 진행하기 <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // [Case] 발송 전 / 발송 중
                            <div className="space-y-4">
                                <button 
                                    onClick={handleSendInvites}
                                    disabled={sendingState === 'sending'}
                                    className={`
                                        w-full h-16 rounded-2xl text-lg font-bold text-[#391B1B] flex items-center justify-center gap-3 shadow-md transition-all relative overflow-hidden
                                        ${sendingState === 'sending' ? 'bg-[#FAE100] cursor-wait' : 'bg-[#FAE100] hover:bg-[#FCE840] hover:-translate-y-1'}
                                    `}
                                >   
                                    {sendingState === 'sending' ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-[#391B1B]/30 border-t-[#391B1B] rounded-full animate-spin" />
                                            <span>발송 중입니다...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle size={24} className="fill-[#391B1B]" />
                                            <span>카카오 알림톡으로 초대장 보내기</span>
                                        </>
                                    )}
                                </button>
                                
                                <div className="flex justify-between items-center px-2">
                                    <button onClick={handleNext} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 transition-colors">
                                        <Clock size={16} />
                                        나중에 발송하기 (건너뛰기)
                                    </button>
                                    <span className="text-xs font-bold text-slate-400">
                                        예상 비용: 0원 (알림톡 프로모션)
                                    </span>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </main>
        </div>
    )
}

function PlusIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
