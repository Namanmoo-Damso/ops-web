import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  subText?: string
  className?: string
}

export function StatCard({ label, value, unit, icon: Icon, subText, className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-3 mb-3 text-muted-foreground">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-foreground">{value}</span>
        {unit && <span className="text-lg font-bold text-muted-foreground">{unit}</span>}
      </div>
      {subText && (
        <p className="text-xs text-muted-foreground mt-2">{subText}</p>
      )}
    </Card>
  )
}
