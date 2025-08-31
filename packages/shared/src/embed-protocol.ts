import { z } from 'zod';

// Protocol version - increment for breaking changes
export const EMBED_PROTOCOL_VERSION = '1.0.0';

// Client to Server events for embed
export const EmbedClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    sessionId: z.string(),
    clientVersion: z.string().optional().default('1.0.0')
  }),
  z.object({
    type: z.literal('start'),
    sampleRate: z.number().default(16000)
  }),
  z.object({
    type: z.literal('audio'),
    chunk: z.string() // base64 encoded PCM16LE 16kHz
  }),
  z.object({
    type: z.literal('endQuestion')
  }),
  z.object({
    type: z.literal('submit')
  }),
  z.object({
    type: z.literal('ping'),
    t: z.number()
  })
]);

export type EmbedClientEvent = z.infer<typeof EmbedClientEventSchema>;

// Server to Client events for embed
export const EmbedServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('state'),
    status: z.enum(['connected', 'listening', 'speaking', 'submitted']),
    qIndex: z.number().optional(),
    qTotal: z.number().optional()
  }),
  z.object({
    type: z.literal('caption'),
    partial: z.boolean(),
    text: z.string()
  }),
  z.object({
    type: z.literal('prompt'),
    text: z.string()
  }),
  z.object({
    type: z.literal('tts'),
    url: z.string().optional(),
    streamChunk: z.string().optional() // base64 audio chunk
  }),
  z.object({
    type: z.literal('timer'),
    remainingSec: z.number()
  }),
  z.object({
    type: z.literal('result'),
    questionId: z.string(),
    transcript: z.string(),
    durationSec: z.number(),
    score: z.number().optional()
  }),
  z.object({
    type: z.literal('error'),
    code: z.string(),
    message: z.string()
  }),
  z.object({
    type: z.literal('pong'),
    t: z.number()
  })
]);

export type EmbedServerEvent = z.infer<typeof EmbedServerEventSchema>;
