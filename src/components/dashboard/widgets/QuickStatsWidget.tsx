'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface QuickStatsWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    period: string
  }
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

export default function QuickStatsWidget({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue'
}: QuickStatsWidgetProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600'
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={`${colorClasses[color]} border-2`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="p-2 rounded-full bg-white/50">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs opacity-75 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
