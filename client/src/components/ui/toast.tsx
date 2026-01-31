import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  onClose?: () => void
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden border p-4 pr-8 shadow-lg transition-all",
        variant === "destructive" && "border-red-500/50 bg-background",
        variant === "success" && "border-border bg-background",
        variant === "default" && "border-border bg-background"
      )}
    >
      <div className="grid gap-0.5">
        {title && <div className={cn(
          "text-xs font-bold uppercase tracking-widest",
          variant === "destructive" && "text-red-600",
          variant === "success" && "text-foreground",
          variant === "default" && "text-foreground"
        )}>{title}</div>}
        {description && <div className={cn(
          "text-xs",
          variant === "destructive" && "text-red-600/80",
          variant === "success" && "text-muted-foreground",
          variant === "default" && "text-muted-foreground"
        )}>{description}</div>}
      </div>
      <button
        onClick={onClose}
        className={cn(
          "absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
          variant === "destructive" && "text-red-600/80 hover:text-red-600",
          variant === "success" && "text-muted-foreground hover:text-foreground",
          variant === "default" && "text-muted-foreground hover:text-foreground"
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}







