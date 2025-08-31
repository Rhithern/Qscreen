'use server'

import { sendEmail, generateInviteEmail, generateReminderEmail, generateTeamInviteEmail } from './resend'

export async function sendCandidateInvite(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
  inviteToken: string,
  expiresAt: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`
  
  const html = generateInviteEmail(
    candidateName,
    jobTitle,
    companyName,
    inviteUrl,
    expiresAt
  )

  return await sendEmail({
    to: candidateEmail,
    subject: `Interview invitation: ${jobTitle} at ${companyName}`,
    html
  })
}

export async function sendCandidateReminder(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string,
  inviteToken: string,
  expiresAt: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`
  
  const html = generateReminderEmail(
    candidateName,
    jobTitle,
    companyName,
    inviteUrl,
    expiresAt
  )

  return await sendEmail({
    to: candidateEmail,
    subject: `Reminder: Complete your interview with ${companyName}`,
    html
  })
}

export async function sendTeamInvite(
  inviteeEmail: string,
  inviteeName: string,
  inviterName: string,
  companyName: string,
  role: string,
  inviteToken: string
) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/team/accept/${inviteToken}`
  
  const html = generateTeamInviteEmail(
    inviteeName,
    inviterName,
    companyName,
    role,
    acceptUrl
  )

  return await sendEmail({
    to: inviteeEmail,
    subject: `You're invited to join ${companyName} on Qscreen`,
    html
  })
}
