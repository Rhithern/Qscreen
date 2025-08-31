import { WebSocket, RawData } from 'ws';
import { ClientEvent, ClientEventSchema, ServerEvent, LLMResponse } from '@ai-interviewer/shared';
import { logger } from './logger';
import { validateSession, getInterviewData, saveResponse, updateSession } from './supabase';
import { generateResponse } from './llm';
import { DeepgramClient } from './deepgram';
import { ElevenLabsClient } from './elevenlabs';
import { VoiceActivityDetector } from './vad';
import { EmbedTokenPayload } from './auth';

export class InterviewSession {
  private ws: WebSocket;
  private interviewId: string | null = null;
  private candidateId: string | null = null;
  private currentQuestionIndex: number = 0;
  private runningScore: number = 0;
  private questions: any[] = [];
  private interview: any = null;
  
  private deepgram: DeepgramClient | null = null;
  private elevenlabs: ElevenLabsClient | null = null;
  private vad: VoiceActivityDetector;
  
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private currentTranscript: string = '';
  private sessionId: string | null = null;

  constructor(ws: WebSocket, tokenPayload?: EmbedTokenPayload | null) {
    this.ws = ws;
    this.vad = new VoiceActivityDetector();
    
    // If we have token payload, pre-populate session data
    if (tokenPayload) {
      this.sessionId = tokenPayload.session_id;
      this.interviewId = tokenPayload.interview_id || null;
      this.candidateId = tokenPayload.candidate_id || null;
    }
  }

  async handleMessage(data: RawData) {
    try {
      const message = JSON.parse(data.toString());
      const event = ClientEventSchema.parse(message);

      switch (event.type) {
        case 'SESSION_META':
          await this.handleSessionMeta(event);
          break;
        case 'START':
          await this.handleStart();
          break;
        case 'STOP':
          await this.handleStop();
          break;
        case 'BARGE_IN':
          await this.handleBargeIn();
          break;
        case 'AUDIO_CHUNK':
          await this.handleAudioChunk(event.data);
          break;
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      this.sendError('Invalid message format');
    }
  }

  private async handleSessionMeta(event: { type: 'SESSION_META'; interviewId: string; candidateId: string }) {
    this.interviewId = event.interviewId;
    this.candidateId = event.candidateId;

    // Validate session
    const isValid = await validateSession(this.interviewId, this.candidateId);
    if (!isValid) {
      this.sendError('Invalid session');
      return;
    }

    // Load interview data
    try {
      const { interview, questions } = await getInterviewData(this.interviewId);
      this.interview = interview;
      this.questions = questions;
      
      logger.info(`Session initialized: interviewId=${this.interviewId}, questions=${questions.length}`);
    } catch (error) {
      logger.error('Error loading interview data:', error);
      this.sendError('Failed to load interview data');
    }
  }

  private async handleStart() {
    if (!this.interviewId || !this.candidateId) {
      this.sendError('Session not initialized');
      return;
    }

    this.isListening = true;
    this.currentQuestionIndex = 0;
    this.runningScore = 0;
    this.vad.reset();

    // Initialize Deepgram
    this.deepgram = new DeepgramClient({
      onInterim: (text) => {
        this.sendEvent({
          type: 'TRANSCRIPT_INTERIM',
          text
        });
      },
      onFinal: async (text) => {
        this.currentTranscript = text;
        this.sendEvent({
          type: 'TRANSCRIPT_FINAL',
          text
        });
        
        await this.processFinalTranscript(text);
      },
      onError: (error) => {
        logger.error('Deepgram error:', error);
        this.sendError('Speech recognition error');
      }
    });

    this.deepgram.connect();

    // Initialize ElevenLabs
    this.elevenlabs = new ElevenLabsClient({
      onAudioChunk: (audioData) => {
        this.sendEvent({
          type: 'TTS_CHUNK',
          data: audioData
        });
      },
      onComplete: () => {
        this.isSpeaking = false;
        this.sendEvent({
          type: 'AGENT_STATE',
          value: 'listening'
        });
      },
      onError: (error) => {
        logger.error('ElevenLabs error:', error);
        this.sendError('Text-to-speech error');
      }
    });

    // Send first question
    await this.sendCurrentQuestion();
  }

  private async handleStop() {
    this.isListening = false;
    this.isSpeaking = false;
    
    if (this.deepgram) {
      this.deepgram.close();
      this.deepgram = null;
    }

    this.sendEvent({
      type: 'COMPLETE'
    });
  }

  private async handleBargeIn() {
    if (this.isSpeaking) {
      this.isSpeaking = false;
      logger.info('Barge-in detected, stopping TTS');
      
      this.sendEvent({
        type: 'AGENT_STATE',
        value: 'listening'
      });
    }
  }

  private async handleAudioChunk(audioData: ArrayBuffer) {
    if (!this.isListening) return;

    // Send to Deepgram
    if (this.deepgram) {
      this.deepgram.sendAudio(audioData);
    }

    // Check for barge-in
    if (this.isSpeaking && this.vad.processAudio(audioData)) {
      await this.handleBargeIn();
    }
  }

  private async processFinalTranscript(transcript: string) {
    if (!transcript.trim()) return;

    this.sendEvent({
      type: 'AGENT_STATE',
      value: 'thinking'
    });

    try {
      const currentQuestion = this.questions[this.currentQuestionIndex];
      if (!currentQuestion) {
        await this.handleStop();
        return;
      }

      const llmResponse = await generateResponse(
        currentQuestion.prompt,
        currentQuestion.reference_answer,
        transcript,
        this.runningScore,
        this.questions.length - this.currentQuestionIndex - 1
      );

      // Save response to database
      await saveResponse(
        this.interviewId!,
        currentQuestion.id,
        this.candidateId!,
        transcript,
        llmResponse.score_delta,
        llmResponse.feedback
      );

      // Update running score
      if (llmResponse.score_delta !== null) {
        this.runningScore += llmResponse.score_delta;
      }

      // Send TTS response
      this.isSpeaking = true;
      this.sendEvent({
        type: 'AGENT_STATE',
        value: 'speaking'
      });

      if (this.elevenlabs) {
        await this.elevenlabs.streamTTS(llmResponse.speak);
      }

      // Handle follow-up or next question
      if (llmResponse.followup) {
        // Add follow-up as a temporary question
        this.questions.splice(this.currentQuestionIndex + 1, 0, {
          id: `followup-${Date.now()}`,
          prompt: llmResponse.followup,
          reference_answer: null,
          position: this.currentQuestionIndex + 1
        });
      } else {
        // Move to next question
        this.currentQuestionIndex++;
      }

      // Update session in database
      await updateSession(
        this.sessionId || 'temp',
        this.currentQuestionIndex,
        this.runningScore
      );

    } catch (error) {
      logger.error('Error processing final transcript:', error);
      this.sendError('Failed to process response');
    }
  }

  private async sendCurrentQuestion() {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (currentQuestion) {
      this.sendEvent({
        type: 'QUESTION_UPDATE',
        index: this.currentQuestionIndex,
        prompt: currentQuestion.prompt
      });
    }
  }

  private sendEvent(event: ServerEvent) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  public sendError(message: string) {
    this.sendEvent({
      type: 'ERROR',
      message
    });
  }

  cleanup() {
    this.isListening = false;
    this.isSpeaking = false;
    
    if (this.deepgram) {
      this.deepgram.close();
    }
  }
}


