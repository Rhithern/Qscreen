import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailTemplate) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || 'Qscreen <noreply@qscreen.ai>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function generateInviteEmail(
  candidateName: string,
  jobTitle: string,
  companyName: string,
  inviteUrl: string,
  expiresAt: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Invitation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Qscreen</div>
        </div>
        
        <div class="content">
          <h2>You're invited to interview with ${companyName}</h2>
          
          <p>Hi ${candidateName},</p>
          
          <p>You've been invited to complete a video interview for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
          
          <p>This is a convenient way for you to showcase your skills and experience at your own pace. The interview consists of a few questions that you'll answer by recording video responses.</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">Start Interview</a>
          </p>
          
          <p><strong>Important details:</strong></p>
          <ul>
            <li>This invitation expires on ${new Date(expiresAt).toLocaleDateString()}</li>
            <li>You can pause and resume the interview at any time</li>
            <li>Make sure you have a quiet environment and good lighting</li>
            <li>The interview typically takes 15-30 minutes</li>
          </ul>
          
          <p>If you have any questions or technical issues, please don't hesitate to reach out to the hiring team.</p>
          
          <p>Good luck!</p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${companyName} via Qscreen</p>
          <p>If you believe you received this email in error, please ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateReminderEmail(
  candidateName: string,
  jobTitle: string,
  companyName: string,
  inviteUrl: string,
  expiresAt: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .content { background: #fef3c7; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Qscreen</div>
        </div>
        
        <div class="content">
          <h2>⏰ Reminder: Complete your interview with ${companyName}</h2>
          
          <p>Hi ${candidateName},</p>
          
          <p>This is a friendly reminder that you have a pending video interview for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
          
          <p><strong>Your invitation expires on ${new Date(expiresAt).toLocaleDateString()}</strong></p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">Complete Interview Now</a>
          </p>
          
          <p>Don't miss this opportunity to showcase your skills and move forward in the hiring process.</p>
        </div>
        
        <div class="footer">
          <p>This reminder was sent by ${companyName} via Qscreen</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateTeamInviteEmail(
  inviteeName: string,
  inviterName: string,
  companyName: string,
  role: string,
  acceptUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .content { background: #f0f9ff; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Qscreen</div>
        </div>
        
        <div class="content">
          <h2>You're invited to join ${companyName} on Qscreen</h2>
          
          <p>Hi ${inviteeName},</p>
          
          <p>${inviterName} has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong> on Qscreen.</p>
          
          <p>Qscreen is a modern interview platform that helps teams conduct efficient video interviews and make better hiring decisions.</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
          </p>
          
          <p>Once you join, you'll be able to:</p>
          <ul>
            <li>Review candidate interviews and responses</li>
            <li>Collaborate with your team on hiring decisions</li>
            <li>Access analytics and insights</li>
            <li>Manage interview workflows</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${inviterName} from ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `
}
