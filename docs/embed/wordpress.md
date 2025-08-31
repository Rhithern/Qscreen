# WordPress Integration Guide

Integrate the AI Interviewer widget into your WordPress site.

## Method 1: Plugin Integration (Recommended)

### Step 1: Install Custom HTML Plugin
Install a plugin like "Insert Headers and Footers" or "Custom HTML Block"

### Step 2: Create Interview Page
1. Create a new page: **Pages > Add New**
2. Title: "AI Interview"
3. Add a **Custom HTML** block

### Step 3: Add Widget Code
```html
<div id="ai-interview-container" style="width: 100%; max-width: 800px; height: 600px; margin: 0 auto;"></div>

<script src="https://your-domain.com/cdn/embed/embed.min.js"></script>
<script>
jQuery(document).ready(function($) {
  // Get token from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('token');
  
  if (inviteToken) {
    QscreenInterview.mount({
      el: '#ai-interview-container',
      inviteToken: inviteToken,
      theme: 'auto',
      onStart: function() {
        console.log('Interview started');
        // Track with Google Analytics if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'interview_started', {
            event_category: 'engagement'
          });
        }
      },
      onComplete: function(result) {
        console.log('Interview completed', result);
        // Redirect to thank you page
        window.location.href = '/thank-you/';
      },
      onError: function(error) {
        console.error('Interview error:', error);
        $('#ai-interview-container').html(
          '<div style="text-align: center; padding: 40px; border: 2px solid #e74c3c; border-radius: 8px; background: #fdf2f2;">' +
          '<h3 style="color: #e74c3c; margin-bottom: 15px;">Interview Unavailable</h3>' +
          '<p style="color: #666;">Please check your interview link or contact support.</p>' +
          '</div>'
        );
      }
    });
  } else {
    $('#ai-interview-container').html(
      '<div style="text-align: center; padding: 40px; border: 2px solid #f39c12; border-radius: 8px; background: #fef9e7;">' +
      '<h3 style="color: #f39c12; margin-bottom: 15px;">Interview Token Required</h3>' +
      '<p style="color: #666;">Please use the interview link provided in your email invitation.</p>' +
      '</div>'
    );
  }
});
</script>
```

## Method 2: Theme Functions (Advanced)

### Step 1: Add to functions.php
```php
// Add to your theme's functions.php file
function enqueue_interview_widget() {
    if (is_page('interview')) { // Only load on interview page
        wp_enqueue_script(
            'ai-interview-widget',
            'https://your-domain.com/cdn/embed/embed.min.js',
            array(),
            '1.0.0',
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'enqueue_interview_widget');

// Add interview shortcode
function ai_interview_shortcode($atts) {
    $atts = shortcode_atts(array(
        'token' => '',
        'height' => '600px',
        'width' => '100%'
    ), $atts);
    
    $token = $atts['token'] ?: (isset($_GET['token']) ? sanitize_text_field($_GET['token']) : '');
    
    if (empty($token)) {
        return '<div style="text-align: center; padding: 40px; border: 2px solid #f39c12; border-radius: 8px;">
                  <h3>Interview Token Required</h3>
                  <p>Please use the interview link from your email.</p>
                </div>';
    }
    
    $widget_id = 'ai-interview-' . uniqid();
    
    ob_start();
    ?>
    <div id="<?php echo $widget_id; ?>" style="width: <?php echo esc_attr($atts['width']); ?>; height: <?php echo esc_attr($atts['height']); ?>; margin: 0 auto;"></div>
    
    <script>
    jQuery(document).ready(function($) {
        if (typeof QscreenInterview !== 'undefined') {
            QscreenInterview.mount({
                el: '#<?php echo $widget_id; ?>',
                inviteToken: '<?php echo esc_js($token); ?>',
                theme: 'auto',
                onComplete: function(result) {
                    window.location.href = '<?php echo home_url('/thank-you/'); ?>';
                }
            });
        }
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('ai_interview', 'ai_interview_shortcode');
```

### Step 2: Use Shortcode
Add this shortcode to any page or post:
```
[ai_interview]
```

Or with custom parameters:
```
[ai_interview token="abc123" height="700px"]
```

## Method 3: Elementor Integration

### Step 1: Add HTML Widget
1. Edit page with Elementor
2. Add **HTML** widget
3. Paste the widget code

### Step 2: Elementor-Specific Code
```html
<div id="ai-interview-elementor"></div>

<script>
// Wait for Elementor to fully load
jQuery(window).on('elementor/frontend/init', function() {
    const token = new URLSearchParams(window.location.search).get('token');
    
    if (token && typeof QscreenInterview !== 'undefined') {
        QscreenInterview.mount({
            el: '#ai-interview-elementor',
            inviteToken: token,
            theme: 'auto'
        });
    }
});
</script>

<script src="https://your-domain.com/cdn/embed/embed.min.js"></script>
```

## Styling with WordPress Themes

### Custom CSS
Add to **Appearance > Customize > Additional CSS**:

```css
/* Interview widget container */
.ai-interview-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
}

.ai-interview-page .entry-header {
    text-align: center;
    margin-bottom: 30px;
}

.ai-interview-page .entry-content {
    padding: 0;
}

/* Widget styling */
#ai-interview-container {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    background: #ffffff;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    #ai-interview-container {
        background: #1a1a1a;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
}

/* Mobile responsive */
@media (max-width: 768px) {
    .ai-interview-page {
        padding: 10px;
    }
    
    #ai-interview-container {
        height: 80vh !important;
        min-height: 500px;
        border-radius: 8px;
    }
}

/* Hide WordPress elements on interview page */
.page-template-interview .site-header,
.page-template-interview .site-footer {
    display: none;
}

.page-template-interview .site-main {
    padding-top: 0;
}
```

## Security Considerations

### Content Security Policy
Add to your theme's header.php or use a security plugin:

```php
// Allow the interview widget domain
add_action('wp_head', function() {
    if (is_page('interview')) {
        echo '<meta http-equiv="Content-Security-Policy" content="script-src \'self\' \'unsafe-inline\' https://your-domain.com;">';
    }
});
```

### User Permissions
```php
// Restrict interview page access if needed
function restrict_interview_page() {
    if (is_page('interview') && !is_user_logged_in()) {
        // Optionally redirect to login
        // wp_redirect(wp_login_url(get_permalink()));
        // exit;
    }
}
add_action('template_redirect', 'restrict_interview_page');
```

## WooCommerce Integration

For e-commerce sites offering interview services:

```php
// Add interview after purchase
function add_interview_after_purchase($order_id) {
    $order = wc_get_order($order_id);
    
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        
        // Check if product is an interview service
        if ($product->get_meta('_is_interview_service')) {
            $invite_token = generate_interview_token($order->get_billing_email());
            
            // Send email with interview link
            $interview_url = home_url('/interview/?token=' . $invite_token);
            wp_mail(
                $order->get_billing_email(),
                'Your AI Interview is Ready',
                'Click here to start your interview: ' . $interview_url
            );
        }
    }
}
add_action('woocommerce_order_status_completed', 'add_interview_after_purchase');
```

## Multisite Considerations

For WordPress multisite networks:

```php
// Network-wide interview functionality
function network_interview_scripts() {
    if (is_page('interview')) {
        wp_enqueue_script(
            'ai-interview-widget',
            'https://your-domain.com/cdn/embed/embed.min.js',
            array(),
            '1.0.0',
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'network_interview_scripts');

// Allow interview page on all sites
function create_interview_page_on_new_site($blog_id) {
    switch_to_blog($blog_id);
    
    $page_data = array(
        'post_title' => 'AI Interview',
        'post_content' => '[ai_interview]',
        'post_status' => 'publish',
        'post_type' => 'page',
        'post_name' => 'interview'
    );
    
    wp_insert_post($page_data);
    restore_current_blog();
}
add_action('wpmu_new_blog', 'create_interview_page_on_new_site');
```

## Testing Checklist

- [ ] Test widget loading on different themes
- [ ] Verify mobile responsiveness
- [ ] Check microphone permissions
- [ ] Test with caching plugins disabled
- [ ] Verify HTTPS is working
- [ ] Test shortcode functionality
- [ ] Check error handling
- [ ] Verify analytics tracking
