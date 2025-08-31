export interface EmbedConfig {
  conductorUrl: string;
  webOrigin: string;
  features: {
    captions: boolean;
    progress: boolean;
  };
}

export interface MountOptions {
  el: string | HTMLElement;
  inviteToken: string;
  theme?: {
    primary?: string;
    background?: string;
    text?: string;
  };
  captions?: boolean;
  onEvent?: (event: EmbedEvent) => void;
}

export interface EmbedEvent {
  type: 'start' | 'question' | 'submitted' | 'error';
  data?: any;
}

export interface TokenResponse {
  wsToken: string;
  sessionId: string;
  jobId?: string;
  interviewId?: string;
  candidateId?: string;
}
