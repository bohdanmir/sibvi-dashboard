"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  strokeColor?: string
  fillColor?: string
  showValue?: boolean
  valueFormatter?: (value: number) => string
}

const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  ({ 
    className, 
    data, 
    width = 100, 
    height = 30, 
    strokeWidth = 1.5, 
    strokeColor = "hsl(var(--foreground))",
    fillColor = "hsl(var(--muted))",
    showValue = false,
    valueFormatter = (value) => value.toString(),
    ...props 
  }, ref) => {
    if (!data || data.length === 0) {
      return (
        <div 
          ref={ref}
          className={cn("flex items-center justify-center text-muted-foreground", className)}
          style={{ width, height }}
          {...props}
        >
          No data
        </div>
      )
    }

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    }).join(" ")

    const path = `M ${points}`

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="sparkline-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          {/* Fill area */}
          <path
            d={`${path} L ${width},${height} L 0,${height} Z`}
            fill="url(#sparkline-fill)"
          />
          
          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        {showValue && (
          <span className="text-xs font-medium text-muted-foreground">
            {valueFormatter(data[data.length - 1])}
          </span>
        )}
      </div>
    )
  }
)

Sparkline.displayName = "Sparkline"

export { Sparkline }
