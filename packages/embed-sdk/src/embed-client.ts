import { EmbedConfig, MountOptions, TokenResponse, EmbedEvent } from './types';
import { EmbedClientEvent, EmbedServerEvent } from '@ai-interviewer/shared';

export class EmbedClient {
  private element: HTMLElement;
  private options: MountOptions;
  private config: EmbedConfig | null = null;
  private tokenData: TokenResponse | null = null;
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(element: HTMLElement, options: MountOptions) {
    this.element = element;
    this.options = options;
  }

  async initialize(): Promise<void> {
    try {
      // Fetch configuration
      this.config = await this.fetchConfig();
      
      // Fetch token
      this.tokenData = await this.fetchToken();
      
      // Render UI
      this.renderUI();
      
      this.emitEvent('start', { sessionId: this.tokenData.sessionId });
    } catch (error) {
      console.error('Failed to initialize embed client:', error);
      this.emitEvent('error', { message: 'Failed to initialize' });
      this.renderError('Failed to initialize interview widget');
    }
  }

  private async fetchConfig(): Promise<EmbedConfig> {
    const response = await fetch(`${this.getWebOrigin()}/api/embed/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch configuration');
    }
    return response.json();
  }

  private async fetchToken(): Promise<TokenResponse> {
    const response = await fetch(`${this.getWebOrigin()}/api/embed/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteToken: this.options.inviteToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch token');
    }

    return response.json();
  }

  private getWebOrigin(): string {
    return this.config?.webOrigin || window.location.origin;
  }

  private renderUI(): void {
    const theme = this.options.theme || {};
    const primaryColor = theme.primary || '#3b82f6';

    this.element.innerHTML = `
      <div id="qscreen-widget" style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: ${theme.background || '#ffffff'};
        color: ${theme.text || '#111827'};
      ">
        <div id="qscreen-status" style="text-align: center; margin-bottom: 24px;">
          <div id="qscreen-state" style="
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            background: #f3f4f6;
            color: #374151;
            font-size: 14px;
            font-weight: 500;
          ">
            Ready to start
          </div>
        </div>

        <div id="qscreen-progress" style="
          display: none;
          text-align: center;
          margin-bottom: 16px;
          font-size: 14px;
          color: #6b7280;
        ">
          Question <span id="qscreen-current">1</span> of <span id="qscreen-total">5</span>
        </div>

        <div id="qscreen-timer" style="
          display: none;
          text-align: center;
          margin-bottom: 16px;
          font-size: 14px;
          color: #6b7280;
        ">
          Time remaining: <span id="qscreen-time">5:00</span>
        </div>

        <div id="qscreen-question" style="
          display: none;
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid ${primaryColor};
        ">
          <div id="qscreen-question-text" style="font-size: 16px; line-height: 1.5;"></div>
        </div>

        <div id="qscreen-captions" style="
          display: none;
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          min-height: 60px;
          font-size: 14px;
          color: #374151;
        ">
          <div id="qscreen-caption-text">Your response will appear here...</div>
        </div>

        <div id="qscreen-controls" style="text-align: center;">
          <button id="qscreen-join-btn" style="
            background: ${primaryColor};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Start Interview
          </button>
          
          <button id="qscreen-submit-btn" style="
            display: none;
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: 12px;
          ">
            Submit Interview
          </button>
        </div>

        <div id="qscreen-error" style="
          display: none;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
        ">
          <div id="qscreen-error-text"></div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const joinBtn = this.element.querySelector('#qscreen-join-btn') as HTMLButtonElement;
    const submitBtn = this.element.querySelector('#qscreen-submit-btn') as HTMLButtonElement;

    joinBtn?.addEventListener('click', () => this.startInterview());
    submitBtn?.addEventListener('click', () => this.submitInterview());
  }

  private async startInterview(): Promise<void> {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Connect WebSocket
      await this.connectWebSocket();
      
      // Start recording
      this.startRecording(stream);
      
      // Update UI
      this.updateState('listening');
      this.showElement('#qscreen-progress');
      this.showElement('#qscreen-timer');
      this.showElement('#qscreen-question');
      if (this.options.captions !== false) {
        this.showElement('#qscreen-captions');
      }
      this.hideElement('#qscreen-join-btn');
      this.showElement('#qscreen-submit-btn');

    } catch (error) {
      console.error('Failed to start interview:', error);
      this.renderError('Failed to start interview. Please check microphone permissions.');
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.config || !this.tokenData) {
      throw new Error('Missing configuration or token');
    }

    const wsUrl = this.config.conductorUrl.replace(/^http/, 'ws');
    this.ws = new WebSocket(wsUrl, [], {
      headers: {
        'Authorization': `Bearer ${this.tokenData.wsToken}`
      }
    } as any);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.sendMessage({
        type: 'hello',
        sessionId: this.tokenData!.sessionId,
        clientVersion: '1.0.0'
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: EmbedServerEvent = JSON.parse(event.data);
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.renderError('Connection error. Please try again.');
    };
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connectWebSocket().catch(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          this.renderError('Connection lost. Please refresh the page.');
        }
      });
    }, delay);
  }

  private startRecording(stream: MediaStream): void {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(stream);
    
    // Create a script processor for real-time audio processing
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      if (!this.isRecording) return;
      
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      
      // Convert float32 to int16 PCM
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }
      
      // Send as base64
      const base64Chunk = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      this.sendMessage({
        type: 'audio',
        chunk: base64Chunk
      });
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
    
    this.isRecording = true;
    
    // Send start message
    this.sendMessage({
      type: 'start',
      sampleRate: 16000
    });
  }

  private handleServerMessage(message: EmbedServerEvent): void {
    switch (message.type) {
      case 'state':
        this.updateState(message.status);
        if (message.qIndex !== undefined && message.qTotal !== undefined) {
          this.updateProgress(message.qIndex + 1, message.qTotal);
        }
        break;
        
      case 'caption':
        if (this.options.captions !== false) {
          this.updateCaption(message.text, message.partial);
        }
        break;
        
      case 'prompt':
        this.updateQuestion(message.text);
        this.emitEvent('question', { text: message.text });
        break;
        
      case 'tts':
        if (message.streamChunk) {
          this.playAudioChunk(message.streamChunk);
        }
        break;
        
      case 'timer':
        this.updateTimer(message.remainingSec);
        break;
        
      case 'result':
        console.log('Question result:', message);
        break;
        
      case 'error':
        this.renderError(message.message);
        this.emitEvent('error', { code: message.code, message: message.message });
        break;
        
      case 'pong':
        // Handle pong for connection health
        break;
    }
  }

  private updateState(status: string): void {
    const stateEl = this.element.querySelector('#qscreen-state');
    if (stateEl) {
      const statusText = {
        connected: 'Connected',
        listening: 'Listening...',
        speaking: 'Speaking',
        submitted: 'Submitted'
      }[status] || status;
      
      stateEl.textContent = statusText;
      
      // Update styling based on status
      const colors = {
        connected: '#6b7280',
        listening: '#10b981',
        speaking: '#f59e0b',
        submitted: '#8b5cf6'
      };
      
      (stateEl as HTMLElement).style.background = colors[status as keyof typeof colors] || '#f3f4f6';
      (stateEl as HTMLElement).style.color = status === 'connected' ? '#374151' : '#ffffff';
    }
  }

  private updateProgress(current: number, total: number): void {
    const currentEl = this.element.querySelector('#qscreen-current');
    const totalEl = this.element.querySelector('#qscreen-total');
    
    if (currentEl) currentEl.textContent = current.toString();
    if (totalEl) totalEl.textContent = total.toString();
  }

  private updateTimer(remainingSec: number): void {
    const timerEl = this.element.querySelector('#qscreen-time');
    if (timerEl) {
      const minutes = Math.floor(remainingSec / 60);
      const seconds = remainingSec % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private updateQuestion(text: string): void {
    const questionEl = this.element.querySelector('#qscreen-question-text');
    if (questionEl) {
      questionEl.textContent = text;
    }
  }

  private updateCaption(text: string, partial: boolean): void {
    const captionEl = this.element.querySelector('#qscreen-caption-text');
    if (captionEl) {
      captionEl.textContent = text;
      (captionEl as HTMLElement).style.opacity = partial ? '0.7' : '1';
    }
  }

  private playAudioChunk(base64Chunk: string): void {
    try {
      const audioData = atob(base64Chunk);
      const audioBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(audioBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Decode and play audio
      this.audioContext.decodeAudioData(audioBuffer).then(buffer => {
        const source = this.audioContext!.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext!.destination);
        source.start();
      }).catch(error => {
        console.error('Error playing audio chunk:', error);
      });
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  private async submitInterview(): Promise<void> {
    this.sendMessage({ type: 'submit' });
    this.updateState('submitted');
    this.isRecording = false;
    this.emitEvent('submitted', {});
  }

  private sendMessage(message: EmbedClientEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private showElement(selector: string): void {
    const el = this.element.querySelector(selector) as HTMLElement;
    if (el) el.style.display = 'block';
  }

  private hideElement(selector: string): void {
    const el = this.element.querySelector(selector) as HTMLElement;
    if (el) el.style.display = 'none';
  }

  private renderError(message: string): void {
    const errorEl = this.element.querySelector('#qscreen-error-text');
    if (errorEl) {
      errorEl.textContent = message;
      this.showElement('#qscreen-error');
    }
  }

  private emitEvent(type: EmbedEvent['type'], data: any): void {
    if (this.options.onEvent) {
      this.options.onEvent({ type, data });
    }
  }

  async destroy(): Promise<void> {
    this.isRecording = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    this.element.innerHTML = '';
  }
}
