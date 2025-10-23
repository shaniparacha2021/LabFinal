'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChartData {
  label: string
  value: number
  color: string
  percentage: number
}

interface AnalyticsChartProps {
  title: string
  data: ChartData[]
  type: 'pie' | 'bar' | 'line'
  showPercentages?: boolean
  showValues?: boolean
}

export default function AnalyticsChart({
  title,
  data,
  type,
  showPercentages = true,
  showValues = true
}: AnalyticsChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const maxValue = Math.max(...data.map(item => item.value))

  const renderPieChart = () => {
    let cumulativePercentage = 0
    
    return (
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const circumference = 2 * Math.PI * 15 // radius = 15
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference)
            
            cumulativePercentage += percentage
            
            return (
              <circle
                key={index}
                cx="16"
                cy="16"
                r="15"
                fill="none"
                stroke={item.color}
                strokeWidth="2"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{total}</div>
            <div className="text-xs opacity-75">Total</div>
          </div>
        </div>
      </div>
    )
  }

  const renderBarChart = () => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            {showPercentages && (
              <div className="text-xs text-gray-500">
                {((item.value / total) * 100).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderLineChart = () => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {showValues && (
                <span className="text-sm font-medium">{item.value}</span>
              )}
              {showPercentages && (
                <Badge variant="secondary" className="text-xs">
                  {((item.value / total) * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart()
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      default:
        return renderBarChart()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  )
}
