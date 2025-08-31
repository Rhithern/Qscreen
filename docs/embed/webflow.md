# Webflow Integration Guide

Integrate the AI Interviewer widget into your Webflow site.

## Step 1: Add Embed Element

1. In Webflow Designer, drag an **Embed** element to your page
2. Size the embed element (recommended: 800px width, 600px height)

## Step 2: Embed Code

Paste this code into the Embed element:

```html
<div id="ai-interview-widget" style="width: 100%; height: 100%;"></div>

<script src="https://your-domain.com/cdn/embed/embed.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Get token from URL parameter or Webflow form
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token') || 
                       document.querySelector('[data-interview-token]')?.dataset.interviewToken;
    
    if (inviteToken) {
      QscreenInterview.mount({
        el: '#ai-interview-widget',
        inviteToken: inviteToken,
        theme: 'auto',
        onStart: () => {
          // Track with Webflow analytics or Google Analytics
          if (typeof gtag !== 'undefined') {
            gtag('event', 'interview_started');
          }
        },
        onComplete: (result) => {
          // Redirect to thank you page
          window.location.href = '/thank-you';
        },
        onError: (error) => {
          console.error('Interview error:', error);
          document.getElementById('ai-interview-widget').innerHTML = 
            '<div style="text-align: center; padding: 40px; color: #e74c3c;">' +
            '<h3>Interview Unavailable</h3>' +
            '<p>Please try again later or contact support.</p>' +
            '</div>';
        }
      });
    } else {
      document.getElementById('ai-interview-widget').innerHTML = 
        '<div style="text-align: center; padding: 40px;">' +
        '<h3>Interview Link Required</h3>' +
        '<p>Please use the interview link provided in your email.</p>' +
        '</div>';
    }
  });
</script>
```

## Step 3: Custom Styling

Add custom CSS in **Project Settings > Custom Code > Head**:

```html
<style>
  .interview-container {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    background: white;
    margin: 20px auto;
  }
  
  .interview-container.dark-mode {
    background: #1a1a1a;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .interview-container {
      margin: 10px;
      border-radius: 8px;
    }
  }
</style>
```

## Step 4: Token Passing Methods

### Method A: URL Parameter
Create interview pages with URLs like:
```
https://yoursite.com/interview?token=abc123
```

### Method B: Form Integration
If using Webflow forms to collect candidate info:

1. Add a hidden field to your form with name `interview-token`
2. Set the field value via JavaScript:

```html
<script>
  // Set token from email link or admin system
  document.querySelector('input[name="interview-token"]').value = 'token-from-backend';
</script>
```

### Method C: CMS Integration
For dynamic content from Webflow CMS:

1. Add a plain text field called "Interview Token" to your CMS collection
2. In the embed code, reference the CMS field:

```html
<div data-interview-token="{{wf {&quot;path&quot;:&quot;interview-token&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}"></div>
```

## Step 5: Page Structure

Create a dedicated interview page with:

1. **Header**: Minimal navigation
2. **Main Content**: Interview widget embed
3. **Footer**: Support contact info

Example page structure:
```html
<!-- In page head -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">

<!-- Page content -->
<div class="interview-page">
  <header>
    <h1>AI Interview</h1>
    <p>Please ensure you're in a quiet environment with a stable internet connection.</p>
  </header>
  
  <main>
    <!-- Webflow Embed Element goes here -->
  </main>
  
  <footer>
    <p>Need help? Contact <a href="mailto:support@company.com">support@company.com</a></p>
  </footer>
</div>
```

## Step 6: Mobile Optimization

Add mobile-specific styles:

```html
<style>
  @media (max-width: 768px) {
    #ai-interview-widget {
      height: 80vh !important;
      min-height: 500px;
    }
    
    .interview-page {
      padding: 10px;
    }
    
    .interview-page header {
      margin-bottom: 20px;
    }
    
    .interview-page h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
  }
</style>
```

## Advanced Features

### Loading Animation
```html
<div id="ai-interview-widget">
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p>Preparing your interview...</p>
  </div>
</div>

<style>
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
```

### Analytics Integration
```javascript
// Google Analytics 4
QscreenInterview.mount({
  el: '#ai-interview-widget',
  inviteToken: inviteToken,
  onStart: () => {
    gtag('event', 'interview_started', {
      event_category: 'engagement',
      event_label: 'ai_interview'
    });
  },
  onComplete: (result) => {
    gtag('event', 'interview_completed', {
      event_category: 'conversion',
      event_label: 'ai_interview',
      value: 1
    });
  }
});
```

## Testing Checklist

- [ ] Test widget loading on desktop
- [ ] Test widget loading on mobile
- [ ] Verify microphone permissions work
- [ ] Test with invalid/expired tokens
- [ ] Check responsive design
- [ ] Verify analytics tracking
- [ ] Test error handling

## Publishing

1. **Staging**: Test on Webflow staging domain first
2. **Custom Domain**: Ensure your custom domain is in the CORS allowlist
3. **SSL**: Verify HTTPS is enabled (required for microphone access)
4. **Performance**: Check page load speed with widget

## Troubleshooting

**Widget not appearing:**
- Check browser console for errors
- Verify embed code is in an Embed element, not HTML element
- Ensure CDN URL is accessible

**CORS errors:**
- Add your Webflow domain to the allowlist
- Include both `webflow.io` and custom domain if applicable

**Mobile issues:**
- Test microphone permissions on actual devices
- Verify responsive CSS is working
- Check viewport meta tag is present
