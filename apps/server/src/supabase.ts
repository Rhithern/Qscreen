import { createClient } from '@supabase/supabase-js';
import { logger } from './utils/logger';
import { config } from './config';

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const validateSession = async (interviewId: string, candidateId: string) => {
  try {
    // Check if candidate is invited to this interview
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('candidate_email', candidateId)
      .single();

    if (invitationError || !invitation) {
      logger.warn(`Invalid session: interviewId=${interviewId}, candidateId=${candidateId}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating session:', error);
    return false;
  }
};

export const getInterviewData = async (interviewId: string) => {
  try {
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (interviewError) throw interviewError;

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('interview_id', interviewId)
      .order('position');

    if (questionsError) throw questionsError;

    return { interview, questions };
  } catch (error) {
    logger.error('Error fetching interview data:', error);
    throw error;
  }
};

export const saveResponse = async (
  interviewId: string,
  questionId: string | null,
  candidateId: string,
  transcript: string,
  score: number | null,
  feedback: string | null
) => {
  try {
    const { error } = await supabase
      .from('responses')
      .insert({
        interview_id: interviewId,
        question_id: questionId,
        candidate_id: candidateId,
        transcript,
        score,
        ai_feedback: feedback
      });

    if (error) throw error;
    logger.info('Response saved successfully');
  } catch (error) {
    logger.error('Error saving response:', error);
    throw error;
  }
};

export const updateSession = async (
  sessionId: string,
  currentQuestionIndex: number,
  runningScore: number,
  status: 'in_progress' | 'completed' = 'in_progress'
) => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        current_question_index: currentQuestionIndex,
        running_score: runningScore,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
    logger.info('Session updated successfully');
  } catch (error) {
    logger.error('Error updating session:', error);
    throw error;
  }
};
