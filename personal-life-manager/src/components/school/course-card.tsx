'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle, Clock, ArrowRight } from 'lucide-react'

interface CourseCardProps {
  name: string
  pendingAssignments: number
  totalAssignments: number
}

export function CourseCard({ name, pendingAssignments, totalAssignments }: CourseCardProps) {
  const completedAssignments = totalAssignments - pendingAssignments
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{name}</h3>
              <p className="text-xs text-gray-500">{totalAssignments} total assignments</p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className={`text-xs ${getProgressColor(completionRate)}`}
          >
            {completionRate}%
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-orange-600" />
              <span className="text-gray-600">Pending</span>
            </div>
            <span className="font-medium">{pendingAssignments}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">Completed</span>
            </div>
            <span className="font-medium">{completedAssignments}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs"
        >
          View Details
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  )
}
