import { getAccessState } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, Filter, MoreHorizontal, MessageSquare } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function getQuestions(searchParams: { search?: string; category?: string }) {
  const state = await getAccessState()

  if (!state.hasSession) {
    redirect('/auth/login?next=/question-bank')
  }

  if (!state.role || !['owner', 'admin', 'recruiter', 'reviewer'].includes(state.role)) {
    redirect('/onboarding')
  }

  if (!state.onboardingCompleted) {
    redirect('/onboarding')
  }

  const supabase = await createClient()
  const tenantId = state.tenantId

  if (!tenantId) {
    redirect('/onboarding')
  }

  let query = supabase
    .from('question_bank')
    .select(`
      id,
      text,
      tags,
      time_limit_sec,
      created_at,
      created_by,
      profiles!questions_created_by_fkey(full_name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (searchParams.search) {
    query = query.ilike('question_text', `%${searchParams.search}%`)
  }

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  const { data: questions } = await query

  return questions || []
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const questions = await getQuestions(searchParams)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground">
            Manage your interview questions and templates
          </p>
        </div>
        <Link href="/question-bank/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search questions..."
                  className="pl-10"
                  defaultValue={searchParams.search}
                  name="search"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All</DropdownMenuItem>
                <DropdownMenuItem>Technical</DropdownMenuItem>
                <DropdownMenuItem>Behavioral</DropdownMenuItem>
                <DropdownMenuItem>Problem Solving</DropdownMenuItem>
                <DropdownMenuItem>Communication</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No questions found</h3>
            <p className="text-muted-foreground mb-4">
              {searchParams.search || searchParams.category
                ? 'Try adjusting your search or filters'
                : 'Create your first question to build your interview bank'}
            </p>
            <Link href="/question-bank/create">
              <Button>Add Question</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {question.question_type?.replace('_', ' ')}
                      </Badge>
                      {question.category && (
                        <Badge variant="secondary" className="capitalize">
                          {question.category}
                        </Badge>
                      )}
                      {question.difficulty && (
                        <Badge variant={
                          question.difficulty === 'easy' ? 'default' :
                          question.difficulty === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {question.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {question.question_text}
                    </h3>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Created by {question.profiles?.full_name}</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                      {question.time_limit && (
                        <span>{question.time_limit} min limit</span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/question-bank/${question.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/question-bank/${question.id}/edit`}>Edit Question</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
