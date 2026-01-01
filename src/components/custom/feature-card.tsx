import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { LucideIcon, ArrowRight } from "lucide-react"

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  bgIcon?: LucideIcon
  actionLabel?: string
  onClick?: () => void
  className?: string
}

export function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  bgIcon: BgIcon,
  actionLabel = "열기",
  onClick,
  className 
}: FeatureCardProps) {
  return (
    <Card 
      className={cn(
        "p-6 group hover:border-primary transition-all cursor-pointer relative overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      {/* Background Icon */}
      {BgIcon && (
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
          <BgIcon size={80} className="text-primary" />
        </div>
      )}
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon size={24} />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{description}</p>
        <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          {actionLabel} <ArrowRight size={14} />
        </span>
      </div>
    </Card>
  )
}
