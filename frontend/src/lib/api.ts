import { supabase } from './supabase'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  private async getAuthHeaders() {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // Jobs API
  async createJob(jobData: {
    title: string
    description: string
    questions: string[]
  }): Promise<{ job: any; message: string }> {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
  }

  async getJobs(): Promise<{ jobs: any[] }> {
    return this.request('/api/jobs')
  }

  async getJob(id: string) {
    return this.request(`/api/jobs/${id}`)
  }

  // Invitations API
  async inviteCandidate(jobId: string, candidateEmail: string) {
    return this.request('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        candidate_email: candidateEmail,
      }),
    })
  }

  async getInvitations() {
    return this.request('/api/invitations')
  }

  // Responses API
  async getResponses(jobId?: string) {
    const endpoint = jobId ? `/api/responses?job_id=${jobId}` : '/api/responses'
    return this.request(endpoint)
  }

  async getResponse(sessionId: string) {
    return this.request(`/api/responses/${sessionId}`)
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health')
  }
}

export const api = new ApiClient()
