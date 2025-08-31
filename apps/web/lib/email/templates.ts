// Email template utilities for the interview platform

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface InvitationEmailData {
  candidateName: string;
  companyName: string;
  interviewTitle: string;
  inviteUrl: string;
  expiresAt: string;
}

interface PasswordResetEmailData {
  userEmail: string;
  resetUrl: string;
  expiresAt: string;
}

interface WelcomeEmailData {
  userName: string;
  userRole: 'employer' | 'candidate' | 'hr';
  companyName?: string;
  loginUrl: string;
}

export function generateInvitationEmail(data: InvitationEmailData): EmailTemplate {
  const subject = `Interview Invitation - ${data.interviewTitle}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
    .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .btn:hover { background: #0056b3; }
    .info-box { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Invitation</h1>
    </div>
    <div class="content">
      <p>Hello ${data.candidateName},</p>
      
      <p>You have been invited to participate in an interview with <strong>${data.companyName}</strong>.</p>
      
      <div class="info-box">
        <h3>Interview Details</h3>
        <p><strong>Position:</strong> ${data.interviewTitle}</p>
        <p><strong>Company:</strong> ${data.companyName}</p>
        <p><strong>Expires:</strong> ${new Date(data.expiresAt).toLocaleDateString()}</p>
      </div>
      
      <p>To begin your interview, please click the button below:</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.inviteUrl}" class="btn">Start Interview</a>
      </p>
      
      <p><strong>Important Notes:</strong></p>
      <ul>
        <li>This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}</li>
        <li>Please ensure you have a stable internet connection</li>
        <li>Allow microphone access when prompted</li>
        <li>Find a quiet environment for the best experience</li>
      </ul>
      
      <p>If you have any questions, please contact the hiring team at ${data.companyName}.</p>
      
      <p>Best regards,<br>The Interview Platform Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Interview Invitation - ${data.interviewTitle}

Hello ${data.candidateName},

You have been invited to participate in an interview with ${data.companyName}.

Interview Details:
- Position: ${data.interviewTitle}
- Company: ${data.companyName}
- Expires: ${new Date(data.expiresAt).toLocaleDateString()}

To begin your interview, please visit: ${data.inviteUrl}

Important Notes:
- This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}
- Please ensure you have a stable internet connection
- Allow microphone access when prompted
- Find a quiet environment for the best experience

If you have any questions, please contact the hiring team at ${data.companyName}.

Best regards,
The Interview Platform Team

This is an automated message. Please do not reply to this email.
`;

  return { subject, html, text };
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
  const subject = 'Reset Your Password';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
    .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .btn:hover { background: #c82333; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      
      <p>We received a request to reset the password for your account (${data.userEmail}).</p>
      
      <p>To reset your password, please click the button below:</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="btn">Reset Password</a>
      </p>
      
      <div class="warning">
        <p><strong>Security Notice:</strong></p>
        <ul>
          <li>This link will expire on ${new Date(data.expiresAt).toLocaleDateString()}</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will remain unchanged until you create a new one</li>
        </ul>
      </div>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
      
      <p>Best regards,<br>The Interview Platform Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Password Reset Request

Hello,

We received a request to reset the password for your account (${data.userEmail}).

To reset your password, please visit: ${data.resetUrl}

Security Notice:
- This link will expire on ${new Date(data.expiresAt).toLocaleDateString()}
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

Best regards,
The Interview Platform Team

This is an automated message. Please do not reply to this email.
`;

  return { subject, html, text };
}

export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const roleTitle = data.userRole === 'employer' ? 'Employer' : 
                   data.userRole === 'hr' ? 'HR Manager' : 'Candidate';
  
  const subject = `Welcome to the Interview Platform`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
    .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .btn:hover { background: #218838; }
    .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to the Interview Platform!</h1>
    </div>
    <div class="content">
      <p>Hello ${data.userName},</p>
      
      <p>Welcome to the Interview Platform! Your account has been successfully created as a <strong>${roleTitle}</strong>${data.companyName ? ` at ${data.companyName}` : ''}.</p>
      
      <div class="features">
        <h3>What you can do:</h3>
        ${data.userRole === 'employer' ? `
        <ul>
          <li>Create and manage interview sessions</li>
          <li>Invite candidates to interviews</li>
          <li>Review interview results and feedback</li>
          <li>Customize your company branding</li>
        </ul>
        ` : data.userRole === 'hr' ? `
        <ul>
          <li>Review assigned interview sessions</li>
          <li>Access candidate responses and scores</li>
          <li>Provide feedback on interviews</li>
          <li>Collaborate with hiring teams</li>
        </ul>
        ` : `
        <ul>
          <li>Participate in interview sessions</li>
          <li>Complete assessments and questions</li>
          <li>Track your interview progress</li>
          <li>Receive real-time feedback</li>
        </ul>
        `}
      </div>
      
      <p>Ready to get started?</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.loginUrl}" class="btn">Access Your Dashboard</a>
      </p>
      
      <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
      
      <p>Best regards,<br>The Interview Platform Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Welcome to the Interview Platform!

Hello ${data.userName},

Welcome to the Interview Platform! Your account has been successfully created as a ${roleTitle}${data.companyName ? ` at ${data.companyName}` : ''}.

What you can do:
${data.userRole === 'employer' ? `
- Create and manage interview sessions
- Invite candidates to interviews
- Review interview results and feedback
- Customize your company branding
` : data.userRole === 'hr' ? `
- Review assigned interview sessions
- Access candidate responses and scores
- Provide feedback on interviews
- Collaborate with hiring teams
` : `
- Participate in interview sessions
- Complete assessments and questions
- Track your interview progress
- Receive real-time feedback
`}

Ready to get started? Visit: ${data.loginUrl}

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Best regards,
The Interview Platform Team

This is an automated message. Please do not reply to this email.
`;

  return { subject, html, text };
}
