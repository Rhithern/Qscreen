import { logger } from './logger';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  throw new Error('Missing Deepgram API key');
}

export interface DeepgramConfig {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: Error) => void;
}

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private config: DeepgramConfig;

  constructor(config: DeepgramConfig) {
    this.config = config;
  }

  connect() {
    try {
      const url = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&interim_results=true&punctuate=true&diarize=false&smart_format=true`;
      
      this.ws = new WebSocket(url, {
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`
        }
      });

      this.ws.onopen = () => {
        logger.info('Deepgram WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            const isFinal = data.is_final;
            
            if (transcript) {
              if (isFinal) {
                logger.info(`Deepgram final transcript: ${transcript}`);
                this.config.onFinal(transcript);
              } else {
                logger.debug(`Deepgram interim transcript: ${transcript}`);
                this.config.onInterim(transcript);
              }
            }
          }
        } catch (error) {
          logger.error('Error parsing Deepgram message:', error);
        }
      };

      this.ws.onerror = (error) => {
        logger.error('Deepgram WebSocket error:', error);
        this.config.onError(new Error('Deepgram connection error'));
      };

      this.ws.onclose = () => {
        logger.info('Deepgram WebSocket closed');
      };

    } catch (error) {
      logger.error('Error connecting to Deepgram:', error);
      this.config.onError(error as Error);
    }
  }

  sendAudio(audioData: ArrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}


