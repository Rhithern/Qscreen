'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmbedTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [seedToken, setSeedToken] = useState<string>('');

  useEffect(() => {
    // Generate or fetch a test invite token
    fetchTestToken();
    
    // Load embed script
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.onload = () => {
      addLog('Embed SDK loaded successfully');
      initializeWidget();
    };
    script.onerror = () => {
      addLog('ERROR: Failed to load embed SDK');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if ((window as any).QscreenInterview) {
        (window as any).QscreenInterview.unmount('test-widget');
      }
    };
  }, []);

  const fetchTestToken = async () => {
    try {
      // For testing, we'll use a placeholder token
      // In real implementation, this would come from the seed script
      setSeedToken('test-invite-token-' + Date.now());
      addLog('Generated test invite token');
    } catch (error) {
      addLog('ERROR: Failed to fetch test token');
    }
  };

  const initializeWidget = () => {
    if (!(window as any).QscreenInterview || !seedToken) {
      setTimeout(initializeWidget, 100);
      return;
    }

    try {
      (window as any).QscreenInterview.mount({
        el: '#test-widget',
        inviteToken: seedToken,
        theme: {
          primary: '#3b82f6',
          background: '#ffffff',
          text: '#111827'
        },
        captions: true,
        onEvent: (event: any) => {
          addLog(`EVENT: ${event.type} - ${JSON.stringify(event.data)}`);
        }
      });
      addLog('Widget mounted successfully');
    } catch (error) {
      addLog(`ERROR: Failed to mount widget - ${error}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Embed Widget Test Page</h1>
          <p className="text-muted-foreground">
            Test the embeddable interview widget with live logging
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget Container */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Widget</CardTitle>
              <CardDescription>
                The embedded interview widget will appear below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div id="test-widget" className="min-h-[400px]">
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Loading widget...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Event Log</CardTitle>
                <CardDescription>
                  Real-time events and WebSocket state
                </CardDescription>
              </div>
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Clear
              </button>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Waiting for events...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Information */}
        <Card>
          <CardHeader>
            <CardTitle>Test Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Test Token:</strong>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                {seedToken || 'Loading...'}
              </code>
            </div>
            
            <div>
              <strong>Expected Flow:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Widget loads and shows "Start Interview" button</li>
                <li>Click button → requests microphone permission</li>
                <li>WebSocket connects with JWT token</li>
                <li>Status changes to "Listening"</li>
                <li>Questions appear with progress indicator</li>
                <li>Live captions show speech recognition</li>
                <li>Submit button appears after questions</li>
              </ol>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Note:</strong> This test page uses a mock invite token. 
              For full testing, use the seed script to generate real invite tokens.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
