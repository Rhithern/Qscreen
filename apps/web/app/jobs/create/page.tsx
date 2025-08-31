'use client'

import { useState } from 'react'
import { createJob } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export default function CreateJobPage() {
  const [loading, setLoading] = useState(false)
  const [competencies, setCompetencies] = useState<string[]>([])
  const [newCompetency, setNewCompetency] = useState('')
  const [dueDate, setDueDate] = useState<Date>()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      // Add competencies and due date to form data
      formData.append('competencies', JSON.stringify(competencies))
      if (dueDate) {
        formData.append('due_date', dueDate.toISOString())
      }
      
      await createJob(formData)
      toast({
        title: "Job created successfully",
        description: "Your job has been created and saved as draft.",
      })
    } catch (error) {
      toast({
        title: "Failed to create job",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function addCompetency() {
    if (newCompetency.trim() && !competencies.includes(newCompetency.trim())) {
      setCompetencies([...competencies, newCompetency.trim()])
      setNewCompetency('')
    }
  }

  function removeCompetency(competency: string) {
    setCompetencies(competencies.filter(c => c !== competency))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Job</h1>
        <p className="text-muted-foreground">
          Set up a new job posting for candidate interviews
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Basic information about the position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="San Francisco, CA / Remote"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd">Job Description</Label>
              <Textarea
                id="jd"
                name="jd"
                rows={8}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competencies</CardTitle>
            <CardDescription>
              Key skills and competencies to evaluate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value)}
                placeholder="Add a competency..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetency())}
              />
              <Button type="button" onClick={addCompetency}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {competencies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {competencies.map((competency) => (
                  <Badge key={competency} variant="secondary" className="flex items-center gap-1">
                    {competency}
                    <button
                      type="button"
                      onClick={() => removeCompetency(competency)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding (Optional)</CardTitle>
            <CardDescription>
              Customize the appearance for this job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  defaultValue="#3b82f6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  defaultValue="#64748b"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create Job'}
          </Button>
          <Button type="button" variant="outline" disabled={loading}>
            Save as Draft
          </Button>
        </div>
      </form>
    </div>
  )
}
