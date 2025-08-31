'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, Users, Calendar } from 'lucide-react'

interface InterviewListProps {
  interviews: any[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function InterviewList({ interviews, selectedId, onSelect }: InterviewListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (interviews.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No interviews created yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {interviews.map((interview) => (
        <button
          key={interview.id}
          onClick={() => onSelect(interview.id)}
          className={cn(
            "w-full p-4 text-left hover:bg-gray-50 transition-colors",
            selectedId === interview.id && "bg-blue-50 border-r-2 border-blue-500"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900 truncate">{interview.title}</h3>
            <Badge className={getStatusColor(interview.status)}>
              {interview.status}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {interview.questions?.[0]?.count || 0} questions
            </div>
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {interview.invitations?.[0]?.count || 0} invited
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(interview.created_at).toLocaleDateString()}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
