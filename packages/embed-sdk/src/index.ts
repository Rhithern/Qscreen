import { EmbedClient } from './embed-client';
import type { MountOptions } from './types';

// Version info
export const VERSION = '1.0.0';

// Core embed SDK
export { EmbedClient } from './embed-client';

// React wrapper
export { QscreenInterviewWidget } from './react';

// Types
export type { EmbedConfig, MountOptions, TokenResponse, EmbedEvent } from './types';

// Main API class
export class QscreenInterview {
  private static instances = new Map<string, EmbedClient>();

  static async mount(options: MountOptions): Promise<void> {
    const element = typeof options.el === 'string' 
      ? document.querySelector(options.el) 
      : options.el;

    if (!element) {
      throw new Error(`Element not found: ${options.el}`);
    }

    const elementId = element.id || `qscreen-${Date.now()}`;
    if (!element.id) {
      element.id = elementId;
    }

    // Clean up existing instance
    if (this.instances.has(elementId)) {
      this.instances.get(elementId)?.destroy();
    }

    const client = new EmbedClient(element as HTMLElement, options);
    this.instances.set(elementId, client);
    
    await client.initialize();
  }

  static unmount(elementId: string): void {
    const client = this.instances.get(elementId);
    if (client) {
      client.destroy();
      this.instances.delete(elementId);
    }
  }
}

// Global API for UMD build
declare global {
  interface Window {
    QscreenInterview: typeof QscreenInterview;
  }
}

// Auto-register on window for UMD builds
if (typeof window !== 'undefined') {
  window.QscreenInterview = QscreenInterview;
}
