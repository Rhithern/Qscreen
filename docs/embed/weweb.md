# WeWeb Integration Guide

Integrate the AI Interviewer widget into your WeWeb application.

## Step 1: Add Custom Code Element

1. In WeWeb editor, drag a **Custom Code** element to your page
2. Set the element size to fit your design (recommended: 800px width, 600px height)

## Step 2: HTML Structure

In the Custom Code element, add:

```html
<div id="ai-interview-container" style="width: 100%; height: 100%;"></div>

<script src="https://your-domain.com/cdn/embed/embed.min.js"></script>
<script>
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Get invite token from WeWeb variable or URL parameter
    const inviteToken = window.ww?.variables?.inviteToken || 
                       new URLSearchParams(window.location.search).get('token');
    
    if (inviteToken) {
      QscreenInterview.mount({
        el: '#ai-interview-container',
        inviteToken: inviteToken,
        theme: 'auto',
        onStart: () => {
          console.log('Interview started');
          // Optional: Track event in WeWeb
          if (window.ww?.track) {
            window.ww.track('interview_started');
          }
        },
        onComplete: (result) => {
          console.log('Interview completed', result);
          // Optional: Redirect to success page
          window.location.href = '/interview-complete';
        },
        onError: (error) => {
          console.error('Interview error', error);
          // Optional: Show error message
          alert('Interview error: ' + error.message);
        }
      });
    } else {
      document.getElementById('ai-interview-container').innerHTML = 
        '<p style="text-align: center; padding: 40px;">No interview token provided</p>';
    }
  });
</script>
```

## Step 3: Pass Invite Token

### Option A: URL Parameter
Structure your page URL to include the token:
```
https://yoursite.com/interview?token=invite-token-here
```

### Option B: WeWeb Variable
1. Create a WeWeb variable called `inviteToken`
2. Set its value from your backend or form submission
3. The widget will automatically use this variable

## Step 4: Styling (Optional)

Add custom CSS to match your design:

```html
<style>
  #ai-interview-container {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    background: white;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    #ai-interview-container {
      background: #1a1a1a;
    }
  }
</style>
```

## Step 5: Responsive Design

For mobile-friendly interviews:

```html
<style>
  #ai-interview-container {
    width: 100%;
    min-height: 500px;
    height: 80vh;
    max-height: 800px;
  }
  
  @media (max-width: 768px) {
    #ai-interview-container {
      height: 90vh;
      border-radius: 0;
    }
  }
</style>
```

## Advanced Integration

### Custom Event Handling

```javascript
QscreenInterview.mount({
  el: '#ai-interview-container',
  inviteToken: inviteToken,
  onStateChange: (state) => {
    // Update WeWeb UI based on interview state
    if (window.ww?.setVariable) {
      window.ww.setVariable('interviewState', state.status);
    }
  },
  onComplete: (result) => {
    // Store result in WeWeb
    if (window.ww?.setVariable) {
      window.ww.setVariable('interviewResult', result);
    }
    // Navigate to results page
    window.ww?.navigate('/interview-results');
  }
});
```

### Loading State

Show a loading indicator while the widget initializes:

```html
<div id="ai-interview-container">
  <div id="loading" style="text-align: center; padding: 60px;">
    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <p style="margin-top: 20px;">Loading interview...</p>
  </div>
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
```

## Testing

1. Preview your WeWeb page
2. Add `?token=test-token` to the URL
3. Verify the widget loads correctly
4. Test on mobile devices

## Production Checklist

- [ ] Replace `your-domain.com` with your actual domain
- [ ] Configure CORS to allow your WeWeb domain
- [ ] Test with real invite tokens
- [ ] Verify mobile responsiveness
- [ ] Test error handling scenarios
