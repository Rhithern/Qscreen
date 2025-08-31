'use client'

import { useState, useEffect } from 'react'
import { createInvites } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { CalendarIcon, Upload, X, Plus, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Candidate {
  email: string
  name: string
  notes?: string
}

export default function ComposeInvitesPage() {
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [newCandidate, setNewCandidate] = useState({ email: '', name: '', notes: '' })
  const [expiryDate, setExpiryDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days from now
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    // Fetch jobs for selection
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data.jobs || []))
      .catch(console.error)
  }, [])

  async function handleSubmit(formData: FormData) {
    if (candidates.length === 0) {
      toast({
        title: "No candidates",
        description: "Please add at least one candidate",
        variant: "destructive",
      })
      return
    }

    if (!selectedJobId) {
      toast({
        title: "No job selected",
        description: "Please select a job for the invites",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      formData.append('candidates', JSON.stringify(candidates))
      formData.append('jobId', selectedJobId)
      formData.append('expiryDate', expiryDate.toISOString())
      
      await createInvites(formData)
      toast({
        title: "Invites sent successfully",
        description: `${candidates.length} invitations have been sent`,
      })
      setCandidates([])
    } catch (error) {
      toast({
        title: "Failed to send invites",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function addCandidate() {
    if (newCandidate.email && newCandidate.name) {
      if (candidates.some(c => c.email === newCandidate.email)) {
        toast({
          title: "Duplicate email",
          description: "This candidate is already in the list",
          variant: "destructive",
        })
        return
      }
      setCandidates([...candidates, { ...newCandidate }])
      setNewCandidate({ email: '', name: '', notes: '' })
    }
  }

  function removeCandidate(email: string) {
    setCandidates(candidates.filter(c => c.email !== email))
  }

  function handleCSVUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const lines = csv.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const emailIndex = headers.findIndex(h => h.includes('email'))
      const nameIndex = headers.findIndex(h => h.includes('name'))
      const notesIndex = headers.findIndex(h => h.includes('notes'))

      if (emailIndex === -1) {
        toast({
          title: "Invalid CSV",
          description: "CSV must contain an 'email' column",
          variant: "destructive",
        })
        return
      }

      const newCandidates: Candidate[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const email = values[emailIndex]
        const name = nameIndex >= 0 ? values[nameIndex] : email.split('@')[0]
        const notes = notesIndex >= 0 ? values[notesIndex] : ''

        if (email && !candidates.some(c => c.email === email)) {
          newCandidates.push({ email, name, notes })
        }
      }

      setCandidates([...candidates, ...newCandidates])
      toast({
        title: "CSV imported",
        description: `Added ${newCandidates.length} candidates`,
      })
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compose Invites</h1>
        <p className="text-muted-foreground">
          Send interview invitations to candidates
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Selection</CardTitle>
            <CardDescription>
              Choose which job to invite candidates for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} - {job.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>
              Add candidates manually or import from CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CSV Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload CSV file
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      CSV should have columns: email, name, notes (optional)
                    </span>
                  </label>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVUpload}
                  />
                </div>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Email"
                value={newCandidate.email}
                onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
              />
              <Input
                placeholder="Name"
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
              />
              <Input
                placeholder="Notes (optional)"
                value={newCandidate.notes}
                onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
              />
              <Button type="button" onClick={addCandidate}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Candidates List */}
            {candidates.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Candidates ({candidates.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {candidates.map((candidate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                        {candidate.notes && (
                          <div className="text-xs text-muted-foreground">{candidate.notes}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCandidate(candidate.email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure invitation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Select expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={(date) => date && setExpiryDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderSchedule">Reminder Schedule</Label>
              <Textarea
                id="reminderSchedule"
                name="reminderSchedule"
                placeholder="T-72h, T-24h, T-4h"
                defaultValue="T-72h, T-24h, T-4h"
              />
              <p className="text-xs text-muted-foreground">
                When to send reminder emails (e.g., T-72h = 72 hours before expiry)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || candidates.length === 0} className="flex-1">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : `Send ${candidates.length} Invites`}
          </Button>
          <Button type="button" variant="outline">
            Preview Email
          </Button>
        </div>
      </form>
    </div>
  )
}
