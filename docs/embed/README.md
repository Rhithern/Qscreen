# AI Interviewer Embed Widget

Embed the AI Interviewer widget into any website or no-code platform with just a few lines of code.

## Quick Start

### 1. Get Your Invite Token
First, create an interview invitation through the admin dashboard to get an invite token.

### 2. Basic HTML Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Interview</title>
</head>
<body>
    <div id="ai-interview"></div>
    
    <script src="https://your-domain.com/cdn/embed/embed.min.js"></script>
    <script>
        QscreenInterview.mount({
            el: '#ai-interview',
            inviteToken: 'your-invite-token-here',
            onStart: () => console.log('Interview started'),
            onComplete: (result) => console.log('Interview completed', result),
            onError: (error) => console.error('Interview error', error)
        });
    </script>
</body>
</html>
```

### 3. React Integration
```jsx
import { QscreenInterviewWidget } from '@ai-interviewer/embed-sdk';

function InterviewPage() {
  return (
    <QscreenInterviewWidget
      inviteToken="your-invite-token-here"
      onStart={() => console.log('Interview started')}
      onComplete={(result) => console.log('Interview completed', result)}
      onError={(error) => console.error('Interview error', error)}
    />
  );
}
```

## Platform Guides

- [WeWeb Integration](./weweb.md)
- [Webflow Integration](./webflow.md)
- [WordPress Integration](./wordpress.md)
- [Framer Integration](./framer.md)
- [Builder.io Integration](./builder-io.md)
- [Bubble Integration](./bubble.md)

## Configuration Options

### Mount Options
```typescript
interface MountOptions {
  el: string | HTMLElement;           // Target element
  inviteToken: string;                // Interview invitation token
  origin?: string;                    // Your domain (for CORS)
  theme?: 'light' | 'dark' | 'auto';  // UI theme
  language?: string;                  // Interface language
  onStart?: () => void;               // Interview start callback
  onComplete?: (result: any) => void; // Interview completion callback
  onError?: (error: any) => void;     // Error callback
  onStateChange?: (state: any) => void; // State change callback
}
```

### Styling
The widget is fully responsive and supports custom CSS:

```css
.qscreen-interview {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.qscreen-interview.dark {
  background: #1a1a1a;
  color: #ffffff;
}
```

## Events

The widget emits various events during the interview process:

```javascript
QscreenInterview.mount({
  el: '#interview',
  inviteToken: 'token',
  onStart: () => {
    // Interview session started
  },
  onStateChange: (state) => {
    // State: 'connected', 'listening', 'speaking', 'submitted'
    console.log('Interview state:', state.status);
  },
  onComplete: (result) => {
    // Interview completed successfully
    console.log('Final result:', result);
  },
  onError: (error) => {
    // Handle errors
    console.error('Interview error:', error);
  }
});
```

## Security

- All communication is encrypted via HTTPS/WSS
- Invite tokens are single-use and expire after 24 hours
- Origin validation prevents unauthorized embedding
- No sensitive data is stored in browser storage

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Requires microphone permissions for audio recording.

## Troubleshooting

### Common Issues

**Widget not loading:**
- Check that the CDN URL is correct
- Verify CORS settings allow your domain
- Ensure invite token is valid and not expired

**Microphone not working:**
- Check browser permissions
- Ensure HTTPS is used (required for microphone access)
- Test on different browsers

**WebSocket connection failed:**
- Verify WebSocket URL in configuration
- Check firewall/proxy settings
- Ensure origin is in allowlist

### Debug Mode
Enable debug logging:

```javascript
QscreenInterview.mount({
  el: '#interview',
  inviteToken: 'token',
  debug: true // Enables console logging
});
```

## Support

For technical support or integration help:
- Email: support@your-domain.com
- Documentation: https://your-domain.com/docs
- GitHub Issues: https://github.com/your-org/ai-interviewer
