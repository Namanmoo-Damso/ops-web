"use client"

import { LucideIcon, CheckCircle2, Plus, Phone, Settings, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"

interface SetupCardProps {
    step: number
    title: string
    desc: string
    icon: LucideIcon
    iconBgClass: string
    isCompleted: boolean
    onClick: () => void
    actionLabel: string
    subActionLabel?: string
    onSubAction?: (e: React.MouseEvent) => void
}

export function SetupCard({ 
    step, 
    title, 
    desc, 
    icon: Icon, 
    iconBgClass, 
    isCompleted, 
    onClick, 
    actionLabel, 
    subActionLabel,
    onSubAction
}: SetupCardProps) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center text-center bg-card rounded-[2rem] p-8 transition-all cursor-pointer group w-full h-[420px]",
                isCompleted 
                    ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
                    : "shadow-sm border border-border hover:shadow-xl hover:shadow-muted/60 hover:-translate-y-1"
            )}
        >
            {/* Completed Check Icon */}
            {isCompleted && (
                <div className="absolute top-6 right-6 text-primary animate-in zoom-in duration-300 bg-background rounded-full p-1">
                    <CheckCircle2 size={24} strokeWidth={3} />
                </div>
            )}

            {/* Step Badge */}
            <div className="mb-8">
                <span className="text-[12px] font-black uppercase tracking-[0.1em] px-4 py-2 rounded-lg bg-muted text-muted-foreground">
                    STEP {step}
                </span>
            </div>

            {/* Icon Box */}
            <div className={cn(
                "w-[80px] h-[80px] rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-sm transition-transform group-hover:scale-105 duration-300",
                isCompleted ? 'bg-primary' : iconBgClass
            )}>
                <Icon size={36} strokeWidth={2.5} />
            </div>

            {/* Title & Desc */}
            <h3 className="text-2xl font-black text-foreground mb-3">{title}</h3>
            
            <p className="text-muted-foreground font-medium leading-relaxed text-[15px] break-keep px-2 flex-grow">
                {desc}
            </p>

            {/* Buttons Area */}
            <div className="w-full mt-auto space-y-3 pt-6">
                
                {/* Main Button */}
                <button className={cn(
                    "w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-sm",
                    isCompleted 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md'
                )}>
                    {isCompleted ? "완료됨" : (
                        <>
                            {step === 1 && <Plus size={18} strokeWidth={3}/>}
                            {step === 3 && <Phone size={18} strokeWidth={2.5} className="fill-current"/>}
                            {step === 2 && <Settings size={18} strokeWidth={2.5}/>}
                            {actionLabel}
                        </>
                    )}
                </button>
                
                {/* Sub Action */}
                <div className="h-8 flex items-center justify-center">
                    {subActionLabel && !isCompleted ? (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onSubAction?.(e);
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded-lg hover:bg-muted"
                        >
                            <FileSpreadsheet size={16}/>
                            {subActionLabel}
                        </button>
                    ) : (
                        <div className="h-full" />
                    )}
                </div>
            </div>
        </div>
    )
}
