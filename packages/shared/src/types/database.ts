export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string
          custom_domain: string | null
          logo_url: string | null
          primary_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          custom_domain?: string | null
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          custom_domain?: string | null
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenant_members: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: 'employer' | 'hr' | 'candidate'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role: 'employer' | 'hr' | 'candidate'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: 'employer' | 'hr' | 'candidate'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          status: 'draft' | 'open' | 'closed'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          description?: string | null
          status?: 'draft' | 'open' | 'closed'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'open' | 'closed'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          interview_id: string
          prompt: string
          reference_answer: string | null
          tts_voice_id: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          prompt: string
          reference_answer?: string | null
          tts_voice_id?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          prompt?: string
          reference_answer?: string | null
          tts_voice_id?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          interview_id: string
          candidate_email: string
          token: string
          used: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          interview_id: string
          candidate_email: string
          token: string
          used?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          interview_id?: string
          candidate_email?: string
          token?: string
          used?: boolean
          created_at?: string
          expires_at?: string | null
        }
      }
      assignments: {
        Row: {
          id: string
          interview_id: string
          reviewer_id: string
          created_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          reviewer_id: string
          created_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          reviewer_id?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          interview_id: string
          candidate_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'abandoned'
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          candidate_id: string
          status?: 'pending' | 'in_progress' | 'completed' | 'abandoned'
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          candidate_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'abandoned'
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          session_id: string
          question_id: string
          audio_url: string | null
          transcript: string | null
          model_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          audio_url?: string | null
          transcript?: string | null
          model_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          audio_url?: string | null
          transcript?: string | null
          model_score?: number | null
          created_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          response_id: string
          reviewer_id: string
          score: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          response_id: string
          reviewer_id: string
          score: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          reviewer_id?: string
          score?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          interview_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          meta: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          meta?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          meta?: Record<string, any>
          created_at?: string
        }
      }
    }
  }
}

// Helper types for common queries
export type Interview = Database['public']['Tables']['interviews']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Response = Database['public']['Tables']['responses']['Row']
export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
export type TenantMember = Database['public']['Tables']['tenant_members']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

// Extended types with relations
export type InterviewWithDetails = Interview & {
  questions: Question[]
  invitations: Invitation[]
  assignments: { reviewer_id: string; profiles: Profile }[]
  _count: {
    invitations: number
    sessions: number
    completedSessions: number
  }
}

export type ResponseWithEvaluations = Response & {
  question: Question
  evaluations: (Evaluation & { reviewer: Profile })[]
  session: Session & { candidate: Profile }
}

export type SessionWithResponses = Session & {
  candidate: Profile
  interview: Interview
  responses: ResponseWithEvaluations[]
}
