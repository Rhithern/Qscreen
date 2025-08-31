import WebSocket from 'ws';
import { logger } from './utils/logger';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  throw new Error('Missing Deepgram API key');
}

export interface DeepgramConfig {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: Error) => void;
  onOpen: () => void;
  onClose: () => void;
}

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private config: DeepgramConfig;
  private isConnected: boolean = false;

  constructor(config: DeepgramConfig) {
    this.config = config;
  }

  connect() {
    if (this.isConnected) {
      logger.warn('Deepgram already connected');
      return;
    }

    const url = `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&endpointing=300`;
    
    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`
      }
    });

    this.ws.on('open', () => {
      this.isConnected = true;
      logger.info('Deepgram WebSocket connected');
      this.config.onOpen();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.channel?.alternatives?.[0]?.transcript) {
          const transcript = message.channel.alternatives[0].transcript;
          const isFinal = message.is_final || false;
          this.config.onTranscript(transcript, isFinal);
        }
      } catch (error) {
        logger.error('Error parsing Deepgram message:', error);
        this.config.onError(error as Error);
      }
    });

    this.ws.on('error', (error) => {
      logger.error('Deepgram WebSocket error:', error);
      this.config.onError(error);
    });

    this.ws.on('close', () => {
      this.isConnected = false;
      logger.info('Deepgram WebSocket closed');
      this.config.onClose();
    });
  }

  sendAudio(audioData: ArrayBuffer) {
    if (!this.isConnected || !this.ws) {
      logger.warn('Deepgram not connected, cannot send audio');
      return;
    }

    this.ws.send(audioData);
  }

  disconnect() {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
      logger.info('Deepgram WebSocket disconnected');
    }
  }

  finishStream() {
    if (this.ws && this.isConnected) {
      // Send close frame to indicate end of audio stream
      this.ws.send(JSON.stringify({ type: 'CloseStream' }));
    }
  }
}
