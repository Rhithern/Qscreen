import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Code, Zap, Shield, Globe } from 'lucide-react';

export default function EmbedDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const basicHtmlSnippet = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Widget</title>
</head>
<body>
    <div id="qscreen-interview"></div>
    
    <script src="/embed.js" defer></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            QscreenInterview.mount({
                el: '#qscreen-interview',
                inviteToken: 'REPLACE_WITH_INVITE_TOKEN',
                theme: { primary: '#3b82f6' },
                captions: true,
                onEvent: (event) => {
                    console.log('Interview event:', event);
                }
            });
        });
    </script>
</body>
</html>`;

  const modalSnippet = `<button id="start-interview-btn">Start Interview</button>
<div id="interview-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; max-width: 600px; width: 90%;">
        <div id="qscreen-interview"></div>
        <button id="close-modal" style="position: absolute; top: 10px; right: 10px;">×</button>
    </div>
</div>

<script src="/embed.js" defer></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('interview-modal');
    const startBtn = document.getElementById('start-interview-btn');
    const closeBtn = document.getElementById('close-modal');
    
    startBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        QscreenInterview.mount({
            el: '#qscreen-interview',
            inviteToken: 'REPLACE_WITH_INVITE_TOKEN',
            theme: { primary: '#3b82f6' },
            captions: true,
            onEvent: (event) => {
                if (event.type === 'submitted') {
                    modal.style.display = 'none';
                    alert('Interview submitted successfully!');
                }
            }
        });
    });
    
    closeBtn.addEventListener('click', () => {
        QscreenInterview.unmount('#qscreen-interview');
        modal.style.display = 'none';
    });
});
</script>`;

  const reactSnippet = `import { QscreenInterviewWidget } from '@ai-interviewer/embed-sdk/react';

function InterviewPage() {
  const handleEvent = (event) => {
    console.log('Interview event:', event);
    
    if (event.type === 'submitted') {
      // Handle successful submission
      alert('Interview completed!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Complete Your Interview</h1>
      
      <QscreenInterviewWidget
        inviteToken="your-invite-token-here"
        theme={{
          primary: '#3b82f6',
          background: '#ffffff',
          text: '#111827'
        }}
        captions={true}
        onEvent={handleEvent}
        className="my-6"
      />
    </div>
  );
}`;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Embed Documentation</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Integrate live interviews anywhere with our embeddable widget
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary"><Zap className="w-3 h-3 mr-1" />Real-time</Badge>
            <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Secure</Badge>
            <Badge variant="secondary"><Globe className="w-3 h-3 mr-1" />Cross-origin</Badge>
          </div>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get up and running in under 2 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{basicHtmlSnippet}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(basicHtmlSnippet)}
                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm">
                <strong>Replace</strong> <code>REPLACE_WITH_INVITE_TOKEN</code> with an actual invite token from your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Options</CardTitle>
            <CardDescription>
              Customize the widget appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Option</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-left py-2 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-2"><code>el</code></td>
                    <td>string | HTMLElement</td>
                    <td>Container element selector or element</td>
                    <td>Required</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>inviteToken</code></td>
                    <td>string</td>
                    <td>Interview invite token</td>
                    <td>Required</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>theme.primary</code></td>
                    <td>string</td>
                    <td>Primary color (hex)</td>
                    <td>#3b82f6</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>theme.background</code></td>
                    <td>string</td>
                    <td>Background color</td>
                    <td>#ffffff</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>theme.text</code></td>
                    <td>string</td>
                    <td>Text color</td>
                    <td>#111827</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>captions</code></td>
                    <td>boolean</td>
                    <td>Show live captions</td>
                    <td>true</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>onEvent</code></td>
                    <td>function</td>
                    <td>Event callback handler</td>
                    <td>undefined</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Example */}
        <Card>
          <CardHeader>
            <CardTitle>Modal/Popup Example</CardTitle>
            <CardDescription>
              Launch the interview in a modal overlay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                <code>{modalSnippet}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(modalSnippet)}
                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* React Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              React Integration
            </CardTitle>
            <CardDescription>
              Use the React wrapper component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm">
                <strong>Installation:</strong> <code>npm install @ai-interviewer/embed-sdk</code>
              </p>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{reactSnippet}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(reactSnippet)}
                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardHeader>
            <CardTitle>Event Handling</CardTitle>
            <CardDescription>
              Listen to interview lifecycle events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Event</th>
                    <th className="text-left py-2 font-medium">When</th>
                    <th className="text-left py-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2"><code>start</code></td>
                    <td>Interview session begins</td>
                    <td><code>{ sessionId }</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>question</code></td>
                    <td>New question presented</td>
                    <td><code>{ text, index }</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>submitted</code></td>
                    <td>Interview completed</td>
                    <td><code>{}</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2"><code>error</code></td>
                    <td>Error occurred</td>
                    <td><code>{ message, code }</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Setup Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Requirements</CardTitle>
            <CardDescription>
              Server configuration for embed functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Environment Variables</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded text-sm">
                <div># Web App (.env.local)</div>
                <div>EMBED_JWT_SECRET=your-secret-key</div>
                <div>NEXT_PUBLIC_APP_URL=https://yourdomain.com</div>
                <div>NEXT_PUBLIC_CONDUCTOR_URL=wss://conductor.yourdomain.com</div>
                <div className="mt-2"># Conductor (.env)</div>
                <div>ALLOWED_ORIGINS=https://yourdomain.com,https://external-site.com</div>
                <div>EMBED_JWT_SECRET=your-secret-key</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Getting Invite Tokens</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create an interview in your dashboard</li>
                <li>Send invitations to candidates</li>
                <li>Use the invite token from the invitation URL</li>
                <li>Or generate tokens via API for programmatic use</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">CORS Configuration</h4>
              <p className="text-sm text-muted-foreground">
                Add your external domains to <code>ALLOWED_ORIGINS</code> in the Conductor service 
                to enable cross-origin WebSocket connections.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Testing & Development</CardTitle>
            <CardDescription>
              Tools and tips for testing the embed widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <a 
                href="/embed/test" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Open Test Page
              </a>
              <span className="text-sm text-muted-foreground">
                Live widget testing with event logging
              </span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Development Commands</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded text-sm space-y-1">
                <div># Start development servers</div>
                <div>pnpm up</div>
                <div className="mt-2"># Generate test invite tokens</div>
                <div>pnpm seed:dev</div>
                <div className="mt-2"># Build embed SDK</div>
                <div>cd packages/embed-sdk && pnpm build</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-sm">
                <strong>Note:</strong> The widget requires HTTPS in production for microphone access. 
                Use <code>localhost</code> for local development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
