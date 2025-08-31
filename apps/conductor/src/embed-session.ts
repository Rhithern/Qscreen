import { WebSocket, RawData } from 'ws';
import { EmbedClientEvent, EmbedClientEventSchema, EmbedServerEvent } from '@ai-interviewer/shared';
import { logger } from './logger';
import { EmbedTokenPayload } from './auth';
import { DeepgramClient } from './deepgram';
import { ElevenLabsClient } from './elevenlabs';
import { VoiceActivityDetector } from './vad';

export class EmbedInterviewSession {
  private ws: WebSocket;
  private tokenPayload: EmbedTokenPayload;
  private sessionId: string;
  private currentQuestionIndex: number = 0;
  private totalQuestions: number = 0;
  private questions: any[] = [];
  
  private deepgram: DeepgramClient | null = null;
  private elevenlabs: ElevenLabsClient | null = null;
  private vad: VoiceActivityDetector;
  
  private status: 'connected' | 'listening' | 'speaking' | 'submitted' = 'connected';
  private currentTranscript: string = '';
  private questionStartTime: number = 0;
  private questionTimer: NodeJS.Timeout | null = null;

  constructor(ws: WebSocket, tokenPayload: EmbedTokenPayload) {
    this.ws = ws;
    this.tokenPayload = tokenPayload;
    this.sessionId = tokenPayload.session_id;
    this.vad = new VoiceActivityDetector();
  }

  async handleMessage(data: RawData) {
    try {
      const message = JSON.parse(data.toString());
      const event = EmbedClientEventSchema.parse(message);

      switch (event.type) {
        case 'hello':
          await this.handleHello(event);
          break;
        case 'start':
          await this.handleStart(event);
          break;
        case 'audio':
          await this.handleAudio(event);
          break;
        case 'endQuestion':
          await this.handleEndQuestion();
          break;
        case 'submit':
          await this.handleSubmit();
          break;
        case 'ping':
          await this.handlePing(event);
          break;
      }
    } catch (error) {
      logger.error('Error handling embed message:', error);
      this.sendError('INVALID_MESSAGE', 'Invalid message format');
    }
  }

  private async handleHello(event: { type: 'hello'; sessionId: string; clientVersion?: string }) {
    if (event.sessionId !== this.sessionId) {
      this.sendError('INVALID_SESSION', 'Session ID mismatch');
      return;
    }

    // Load interview/job data
    try {
      // TODO: Load questions based on job_id or interview_id from token
      this.questions = []; // Load from database
      this.totalQuestions = this.questions.length;
      
      this.sendState('connected');
      logger.info(`Embed session initialized: sessionId=${this.sessionId}`);
    } catch (error) {
      logger.error('Error initializing embed session:', error);
      this.sendError('INIT_FAILED', 'Failed to initialize session');
    }
  }

  private async handleStart(event: { type: 'start'; sampleRate: number }) {
    this.status = 'listening';
    this.currentQuestionIndex = 0;
    this.questionStartTime = Date.now();

    // Initialize Deepgram
    this.deepgram = new DeepgramClient({
      onInterim: (text) => {
        this.sendCaption(true, text);
      },
      onFinal: async (text) => {
        this.currentTranscript = text;
        this.sendCaption(false, text);
        await this.processTranscript(text);
      },
      onError: (error) => {
        logger.error('Deepgram error:', error);
        this.sendError('STT_ERROR', 'Speech recognition error');
      }
    });

    this.deepgram.connect();

    // Initialize ElevenLabs
    this.elevenlabs = new ElevenLabsClient({
      onAudioChunk: (audioData) => {
        // Convert to base64 for transmission
        const base64Chunk = Buffer.from(audioData).toString('base64');
        this.sendTTS(base64Chunk);
      },
      onComplete: () => {
        this.status = 'listening';
        this.sendState('listening');
      },
      onError: (error) => {
        logger.error('ElevenLabs error:', error);
        this.sendError('TTS_ERROR', 'Text-to-speech error');
      }
    });

    this.sendState('listening');
    await this.sendCurrentQuestion();
    this.startQuestionTimer();
  }

  private async handleAudio(event: { type: 'audio'; chunk: string }) {
    if (this.status !== 'listening') return;

    try {
      // Convert base64 to ArrayBuffer
      const buffer = Buffer.from(event.chunk, 'base64');
      const audioBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      
      // Send to Deepgram
      if (this.deepgram) {
        this.deepgram.sendAudio(audioBuffer);
      }

      // Check for barge-in
      if (this.status === 'listening' && this.vad.processAudio(audioBuffer)) {
        await this.handleBargeIn();
      }
    } catch (error) {
      logger.error('Error processing audio chunk:', error);
    }
  }

  private async handleEndQuestion() {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }

    // Move to next question or end
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.totalQuestions) {
      this.status = 'submitted';
      this.sendState('submitted');
    } else {
      await this.sendCurrentQuestion();
      this.startQuestionTimer();
    }
  }

  private async handleSubmit() {
    this.status = 'submitted';
    this.sendState('submitted');
    
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
    }
    
    // TODO: Mark session as completed in database
    logger.info(`Interview submitted: sessionId=${this.sessionId}`);
  }

  private async handlePing(event: { type: 'ping'; t: number }) {
    this.sendEvent({
      type: 'pong',
      t: event.t
    });
  }

  private async handleBargeIn() {
    if (this.status === 'speaking') {
      this.status = 'listening';
      logger.info('Barge-in detected, stopping TTS');
      this.sendState('listening');
    }
  }

  private async processTranscript(transcript: string) {
    if (!transcript.trim()) return;

    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (!currentQuestion) return;

    const durationSec = Math.floor((Date.now() - this.questionStartTime) / 1000);

    // Send result
    this.sendEvent({
      type: 'result',
      questionId: currentQuestion.id,
      transcript,
      durationSec
    });

    // TODO: Process with LLM and save to database
  }

  private async sendCurrentQuestion() {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (currentQuestion) {
      this.sendEvent({
        type: 'prompt',
        text: currentQuestion.prompt || currentQuestion.question
      });
      
      this.questionStartTime = Date.now();
    }
  }

  private startQuestionTimer() {
    // 5 minute timer per question
    this.questionTimer = setTimeout(() => {
      this.sendEvent({
        type: 'timer',
        remainingSec: 0
      });
      this.handleEndQuestion();
    }, 5 * 60 * 1000);

    // Send timer updates every 30 seconds
    const timerInterval = setInterval(() => {
      if (this.questionTimer) {
        const elapsed = Date.now() - this.questionStartTime;
        const remaining = Math.max(0, Math.floor((5 * 60 * 1000 - elapsed) / 1000));
        
        this.sendEvent({
          type: 'timer',
          remainingSec: remaining
        });

        if (remaining <= 0) {
          clearInterval(timerInterval);
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 30000);
  }

  private sendState(status: 'connected' | 'listening' | 'speaking' | 'submitted') {
    this.status = status;
    this.sendEvent({
      type: 'state',
      status,
      qIndex: this.currentQuestionIndex,
      qTotal: this.totalQuestions
    });
  }

  private sendCaption(partial: boolean, text: string) {
    this.sendEvent({
      type: 'caption',
      partial,
      text
    });
  }

  private sendTTS(streamChunk: string) {
    this.sendEvent({
      type: 'tts',
      streamChunk
    });
  }

  private sendEvent(event: EmbedServerEvent) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  public sendError(code: string, message: string) {
    this.sendEvent({
      type: 'error',
      code,
      message
    });
  }

  cleanup() {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
    }
    
    if (this.deepgram) {
      this.deepgram.close();
    }
  }
}
