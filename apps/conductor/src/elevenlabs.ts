import { logger } from './logger';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

export interface ElevenLabsConfig {
  onAudioChunk: (audioData: ArrayBuffer) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export class ElevenLabsClient {
  private config: ElevenLabsConfig;
  private voiceId: string;

  constructor(config: ElevenLabsConfig, voiceId: string = '21m00Tcm4TlvDq8ikWAM') {
    this.config = config;
    this.voiceId = voiceId;
  }

  async streamTTS(text: string) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert Uint8Array to ArrayBuffer
        const audioChunk = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
        this.config.onAudioChunk(audioChunk);
      }

      const latency = Date.now() - startTime;
      logger.info(`ElevenLabs TTS completed in ${latency}ms`);
      
      this.config.onComplete();
    } catch (error) {
      logger.error('Error streaming TTS:', error);
      this.config.onError(error as Error);
    }
  }

  setVoice(voiceId: string) {
    this.voiceId = voiceId;
  }
}


