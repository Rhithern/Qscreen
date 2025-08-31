# Framer Integration Guide

Integrate the AI Interviewer widget into your Framer site.

## Step 1: Add Code Component

1. In Framer, create a new **Code Component**
2. Name it "AIInterviewWidget"
3. Set dimensions: 800px width, 600px height

## Step 2: Component Code

```tsx
import { addPropertyControls, ControlType } from "framer"

export default function AIInterviewWidget(props) {
    const { inviteToken, theme, height } = props
    
    React.useEffect(() => {
        // Load the embed script
        const script = document.createElement('script')
        script.src = 'https://your-domain.com/cdn/embed/embed.min.js'
        script.async = true
        document.head.appendChild(script)
        
        script.onload = () => {
            if (window.QscreenInterview && inviteToken) {
                window.QscreenInterview.mount({
                    el: '#ai-interview-framer',
                    inviteToken: inviteToken,
                    theme: theme,
                    onStart: () => {
                        console.log('Interview started')
                    },
                    onComplete: (result) => {
                        console.log('Interview completed', result)
                        // Optional: Navigate to success page
                        window.location.href = '/interview-complete'
                    },
                    onError: (error) => {
                        console.error('Interview error:', error)
                    }
                })
            }
        }
        
        return () => {
            // Cleanup
            if (window.QscreenInterview) {
                window.QscreenInterview.unmount('ai-interview-framer')
            }
        }
    }, [inviteToken, theme])
    
    if (!inviteToken) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: '8px',
                color: '#6c757d',
                textAlign: 'center',
                padding: '40px'
            }}>
                <div>
                    <h3>AI Interview Widget</h3>
                    <p>Add an invite token to display the interview</p>
                </div>
            </div>
        )
    }
    
    return (
        <div 
            id="ai-interview-framer" 
            style={{ 
                width: '100%', 
                height: height,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }} 
        />
    )
}

// Property controls for Framer
addPropertyControls(AIInterviewWidget, {
    inviteToken: {
        type: ControlType.String,
        title: "Invite Token",
        placeholder: "Enter interview invite token"
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["auto", "light", "dark"],
        defaultValue: "auto"
    },
    height: {
        type: ControlType.String,
        title: "Height",
        defaultValue: "600px"
    }
})
```

## Step 3: Using the Component

1. Drag your **AIInterviewWidget** component onto the canvas
2. In the properties panel, enter the invite token
3. Adjust theme and height as needed

## Step 4: Dynamic Token Loading

For dynamic tokens from URL parameters or CMS:

```tsx
export default function AIInterviewWidget(props) {
    const [token, setToken] = React.useState(props.inviteToken)
    
    React.useEffect(() => {
        // Get token from URL if not provided as prop
        if (!props.inviteToken) {
            const urlParams = new URLSearchParams(window.location.search)
            const urlToken = urlParams.get('token')
            if (urlToken) {
                setToken(urlToken)
            }
        }
    }, [props.inviteToken])
    
    // Rest of component code using `token` instead of `props.inviteToken`
}
```

## Step 5: CMS Integration

For Framer CMS integration:

1. Create a CMS collection called "Interviews"
2. Add fields: `title`, `description`, `inviteToken`
3. Create a template page for interviews

```tsx
export default function InterviewPage({ interview }) {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h1>{interview.title}</h1>
            <p>{interview.description}</p>
            
            <AIInterviewWidget 
                inviteToken={interview.inviteToken}
                theme="auto"
                height="600px"
            />
        </div>
    )
}
```

## Step 6: Responsive Design

Make the widget responsive:

```tsx
export default function AIInterviewWidget(props) {
    const [dimensions, setDimensions] = React.useState({ width: '100%', height: '600px' })
    
    React.useEffect(() => {
        const updateDimensions = () => {
            if (window.innerWidth < 768) {
                setDimensions({ width: '100%', height: '80vh' })
            } else {
                setDimensions({ width: '100%', height: props.height || '600px' })
            }
        }
        
        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        
        return () => window.removeEventListener('resize', updateDimensions)
    }, [props.height])
    
    return (
        <div 
            id="ai-interview-framer" 
            style={{ 
                width: dimensions.width, 
                height: dimensions.height,
                borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }} 
        />
    )
}
```

## Step 7: Loading States

Add loading and error states:

```tsx
export default function AIInterviewWidget(props) {
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    
    React.useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://your-domain.com/cdn/embed/embed.min.js'
        script.async = true
        
        script.onload = () => {
            try {
                if (window.QscreenInterview && props.inviteToken) {
                    window.QscreenInterview.mount({
                        el: '#ai-interview-framer',
                        inviteToken: props.inviteToken,
                        theme: props.theme,
                        onStart: () => setLoading(false),
                        onError: (err) => {
                            setError(err.message)
                            setLoading(false)
                        }
                    })
                } else {
                    setLoading(false)
                }
            } catch (err) {
                setError('Failed to load interview widget')
                setLoading(false)
            }
        }
        
        script.onerror = () => {
            setError('Failed to load interview script')
            setLoading(false)
        }
        
        document.head.appendChild(script)
    }, [props.inviteToken, props.theme])
    
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: '#f8f9fa'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e9ecef',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p>Loading interview...</p>
                </div>
            </div>
        )
    }
    
    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: '#fff5f5',
                border: '2px solid #fed7d7',
                borderRadius: '8px',
                color: '#c53030',
                textAlign: 'center',
                padding: '40px'
            }}>
                <div>
                    <h3>Interview Unavailable</h3>
                    <p>{error}</p>
                </div>
            </div>
        )
    }
    
    return <div id="ai-interview-framer" style={{ width: '100%', height: '100%' }} />
}
```

## Step 8: Analytics Integration

Track interview events:

```tsx
React.useEffect(() => {
    // Load script and mount widget
    script.onload = () => {
        window.QscreenInterview.mount({
            el: '#ai-interview-framer',
            inviteToken: props.inviteToken,
            onStart: () => {
                // Track with analytics
                if (window.gtag) {
                    window.gtag('event', 'interview_started', {
                        event_category: 'engagement'
                    })
                }
            },
            onComplete: (result) => {
                if (window.gtag) {
                    window.gtag('event', 'interview_completed', {
                        event_category: 'conversion'
                    })
                }
            }
        })
    }
}, [])
```

## Step 9: Custom Styling

Add custom CSS for your Framer site:

```css
/* Add to your site's custom CSS */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.ai-interview-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ai-interview-container button {
    font-family: inherit;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .ai-interview-container {
        background: #1a1a1a;
        color: #ffffff;
    }
}
```

## Testing in Framer

1. **Preview Mode**: Test the component in Framer's preview
2. **Published Site**: Test on the actual published URL
3. **Mobile**: Use device preview to test mobile experience
4. **Different Tokens**: Test with valid and invalid tokens

## Publishing Checklist

- [ ] Replace placeholder domain with actual domain
- [ ] Configure CORS to allow your Framer domain
- [ ] Test component with real invite tokens
- [ ] Verify mobile responsiveness
- [ ] Test loading and error states
- [ ] Check analytics integration
- [ ] Verify HTTPS is working

## Advanced Features

### Multi-language Support
```tsx
addPropertyControls(AIInterviewWidget, {
    language: {
        type: ControlType.Enum,
        title: "Language",
        options: ["en", "es", "fr", "de"],
        defaultValue: "en"
    }
})
```

### Custom Callbacks
```tsx
addPropertyControls(AIInterviewWidget, {
    onComplete: {
        type: ControlType.EventHandler,
        title: "On Complete"
    }
})
```
