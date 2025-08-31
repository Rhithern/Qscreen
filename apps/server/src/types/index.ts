import { z } from 'zod';

// Database types
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

// Client to Server events
export const ClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SESSION_META'),
    interviewId: z.string().uuid(),
    candidateId: z.string().uuid()
  }),
  z.object({
    type: z.literal('START')
  }),
  z.object({
    type: z.literal('STOP')
  }),
  z.object({
    type: z.literal('BARGE_IN')
  }),
  z.object({
    type: z.literal('AUDIO_CHUNK'),
    data: z.instanceof(ArrayBuffer)
  })
]);

export type ClientEvent = z.infer<typeof ClientEventSchema>;

// Server to Client events
export const ServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('TRANSCRIPT_INTERIM'),
    text: z.string()
  }),
  z.object({
    type: z.literal('TRANSCRIPT_FINAL'),
    text: z.string()
  }),
  z.object({
    type: z.literal('AGENT_STATE'),
    value: z.enum(['listening', 'thinking', 'speaking'])
  }),
  z.object({
    type: z.literal('TTS_CHUNK'),
    data: z.instanceof(ArrayBuffer)
  }),
  z.object({
    type: z.literal('QUESTION_UPDATE'),
    index: z.number(),
    prompt: z.string()
  }),
  z.object({
    type: z.literal('COMPLETE')
  }),
  z.object({
    type: z.literal('ERROR'),
    message: z.string()
  })
]);

export type ServerEvent = z.infer<typeof ServerEventSchema>;

// LLM Response Schema
export const LLMResponseSchema = z.object({
  speak: z.string(),
  score_delta: z.number().min(0).max(10).nullable(),
  feedback: z.string(),
  followup: z.string().nullable(),
  end: z.boolean()
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// Embed protocol events
export const EmbedClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('EMBED_INIT'),
    token: z.string()
  }),
  z.object({
    type: z.literal('EMBED_START')
  }),
  z.object({
    type: z.literal('EMBED_STOP')
  }),
  z.object({
    type: z.literal('EMBED_AUDIO'),
    data: z.instanceof(ArrayBuffer)
  })
]);

export type EmbedClientEvent = z.infer<typeof EmbedClientEventSchema>;

export const EmbedServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('EMBED_READY')
  }),
  z.object({
    type: z.literal('EMBED_TRANSCRIPT'),
    text: z.string(),
    isFinal: z.boolean()
  }),
  z.object({
    type: z.literal('EMBED_AUDIO_CHUNK'),
    data: z.instanceof(ArrayBuffer)
  }),
  z.object({
    type: z.literal('EMBED_COMPLETE')
  }),
  z.object({
    type: z.literal('EMBED_ERROR'),
    message: z.string()
  })
]);

export type EmbedServerEvent = z.infer<typeof EmbedServerEventSchema>;
