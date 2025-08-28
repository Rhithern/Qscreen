export interface InterviewSession {
  id: string;
  interview_id: string;
  candidate_id: string;
  current_question_index: number;
  running_score: number;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface InterviewResponse {
  id: string;
  interview_id: string;
  question_id: string;
  candidate_id: string;
  audio_url?: string;
  transcript?: string;
  score?: number;
  feedback?: string;
  created_at: string;
}