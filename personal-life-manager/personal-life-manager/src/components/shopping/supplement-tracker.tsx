'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Package, AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Supplement {
  id: string
  name: string
  quantity_servings?: number | null
  servings_per_day?: number | null
  daysLeft?: number | null
  runOutDate?: Date | null
  status: 'good' | 'low' | 'warning' | 'critical' | 'no-data'
}

interface SupplementTrackerProps {
  supplements: Supplement[]
}

export function SupplementTracker({ supplements }: SupplementTrackerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive'
      case 'warning': return 'secondary'
      case 'low': return 'outline'
      case 'good': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'low':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4 text-gray-400" />
    }
  }

  const getProgressValue = (supplement: Supplement) => {
    if (!supplement.daysLeft || !supplement.quantity_servings || !supplement.servings_per_day) return 0
    const totalDays = supplement.quantity_servings / supplement.servings_per_day
    const progress = (supplement.daysLeft / totalDays) * 100
    return Math.max(0, Math.min(100, progress))
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-orange-500'
      case 'low': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  if (supplements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No supplements tracked</p>
        <p className="text-xs mt-1">Add supplements to monitor your inventory!</p>
      </div>
    )
  }

  // Sort by urgency (critical first)
  const sortedSupplements = [...supplements].sort((a, b) => {
    const statusOrder = { 'critical': 0, 'warning': 1, 'low': 2, 'good': 3, 'no-data': 4 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  return (
    <div className="space-y-4">
      {sortedSupplements.map((supplement) => (
        <div
          key={supplement.id}
          className={`
            p-4 rounded-lg border transition-colors
            ${supplement.status === 'critical' ? 'border-red-200 bg-red-50' :
              supplement.status === 'warning' ? 'border-orange-200 bg-orange-50' :
              'hover:bg-gray-50'}
          `}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(supplement.status)}
              <div>
                <h3 className="font-medium text-sm">{supplement.name}</h3>
                {supplement.servings_per_day && (
                  <p className="text-xs text-gray-500">
                    {supplement.servings_per_day} serving{supplement.servings_per_day !== 1 ? 's' : ''} per day
                  </p>
                )}
              </div>
            </div>

            <Badge variant={getStatusColor(supplement.status)} className="text-xs">
              {supplement.status === 'critical' ? 'Buy Now!' :
               supplement.status === 'warning' ? 'Low Stock' :
               supplement.status === 'low' ? 'Running Low' :
               supplement.status === 'good' ? 'Well Stocked' :
               'No Data'}
            </Badge>
          </div>

          {supplement.daysLeft !== null && supplement.daysLeft !== undefined ? (
            <div className="space-y-2">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(supplement.status)}`}
                  style={{ width: `${getProgressValue(supplement)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">
                    {supplement.daysLeft} {supplement.daysLeft === 1 ? 'day' : 'days'} remaining
                  </span>
                </div>

                {supplement.runOutDate && (
                  <div className="text-gray-500">
                    Runs out: {format(supplement.runOutDate, 'MMM d')}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {supplement.quantity_servings} servings total
                </span>
                <span>
                  {supplement.servings_per_day}/day
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              Add serving information to track inventory
            </div>
          )}

          {supplement.status === 'critical' && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white">
                Add to Shopping List
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
