"use client"

import * as React from "react"
import { Line, LineChart, ResponsiveContainer } from "recharts"
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
    strokeWidth = 1, 
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

    // Transform data for Recharts
    const chartData = data.map((value, index) => ({
      index,
      value
    }))

    // Ensure we have a visible stroke color
    const finalStrokeColor = strokeColor || "hsl(var(--foreground))"

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        <ResponsiveContainer width={width} height={height}>
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={finalStrokeColor}
              strokeWidth={strokeWidth}
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        
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
