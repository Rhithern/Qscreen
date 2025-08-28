import { z } from 'zod';

export const sessionMetadataSchema = z.object({
  type: z.literal('SESSION_META'),
  sessionId: z.string().uuid(),
});

export const audioChunkSchema = z.object({
  type: z.literal('AUDIO_CHUNK'),
  data: z.instanceof(ArrayBuffer),
});

export const clientEventSchema = z.discriminatedUnion('type', [
  sessionMetadataSchema,
  audioChunkSchema,
  z.object({ type: z.literal('START') }),
  z.object({ type: z.literal('STOP') }),
  z.object({ type: z.literal('BARGE_IN') }),
]);
