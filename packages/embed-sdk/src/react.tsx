import React, { useEffect, useRef } from 'react';
import { MountOptions, EmbedEvent } from './types';

declare global {
  interface Window {
    QscreenInterview: {
      mount: (options: MountOptions) => Promise<void>;
      unmount: (elementId: string) => void;
    };
  }
}

interface QscreenInterviewWidgetProps {
  inviteToken: string;
  theme?: 'light' | 'dark';
  captions?: boolean;
  onEvent?: (event: EmbedEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export const QscreenInterviewWidget: React.FC<QscreenInterviewWidgetProps> = ({
  inviteToken,
  theme,
  captions,
  onEvent,
  className,
  style,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !mountedRef.current) {
      mountedRef.current = true;
      
      const elementId = containerRef.current.id || `qscreen-${Date.now()}`;
      window.QscreenInterview.mount({
        el: elementId,
        inviteToken,
        theme: theme ? { primary: theme === 'dark' ? '#1f2937' : '#3b82f6' } : undefined,
        captions,
        onEvent
      }).catch((error: any) => {
        console.error('Failed to mount QscreenInterview widget:', error);
      });
    }

    return () => {
      if (containerRef.current && mountedRef.current) {
        const elementId = containerRef.current.id || `qscreen-${Date.now()}`;
        window.QscreenInterview.unmount(elementId);
        mountedRef.current = false;
      }
    };
  }, [inviteToken, theme, captions, onEvent]);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={style}
      id={`qscreen-widget-${Date.now()}`}
    />
  );
};
