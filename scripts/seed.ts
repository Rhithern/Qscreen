#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Helper function to check if column exists
async function columnExists(supabase: any, schema: string, table: string, column: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', schema)
      .eq('table_name', table)
      .eq('column_name', column)
      .single()
    
    if (error) {
      return false
    }
    
    return !!data
  } catch (error) {
    return false
  }
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  
  const content = readFileSync(path, 'utf8');
  const env: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  
  return env;
}

async function main() {
  log(`${colors.cyan}🌱 Seeding Demo Data${colors.reset}\n`);
  
  // Load environment variables
  const envPath = join(process.cwd(), 'apps/web/.env.local');
  const env = loadEnvFile(envPath);
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
    log(`${colors.red}✗${colors.reset} Supabase configuration missing or invalid`);
    log(`Please run 'pnpm setup' and configure your Supabase keys in apps/web/.env.local`);
    process.exit(1);
  }
  
  // Use service role key for admin operations if available
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // 1. Create or get Demo Company tenant
    log(`${colors.blue}Creating Demo Company tenant...${colors.reset}`);
    
    const { data: existingTenant, error: tenantSelectError } = await supabase
      .from('tenants')
      .select('id, name, subdomain')
      .eq('subdomain', 'demo')
      .single();
    
    let tenantId: string;
    
    if (existingTenant && !tenantSelectError) {
      tenantId = existingTenant.id;
      log(`${colors.yellow}⚠${colors.reset} Using existing tenant: ${existingTenant.name} (${existingTenant.subdomain})`);
    } else {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Demo Company',
          subdomain: 'demo',
          theme: {
            branding: {
              primary_color: '#3b82f6',
              logo_url: null
            }
          }
        })
        .select()
        .single();
      
      if (tenantError) {
        log(`${colors.red}✗${colors.reset} Failed to create tenant: ${tenantError.message}`);
        process.exit(1);
      }
      
      tenantId = newTenant.id;
      log(`${colors.green}✓${colors.reset} Created tenant: Demo Company (demo)`);
    }
    
    // 2. Create demo users
    const demoUsers = [
      {
        email: 'employer@demo.com',
        password: 'demo123456',
        role: 'employer',
        full_name: 'Demo Employer'
      },
      {
        email: 'hr@demo.com', 
        password: 'demo123456',
        role: 'hr',
        full_name: 'Demo HR Manager'
      },
      {
        email: 'candidate@demo.com',
        password: 'demo123456', 
        role: 'candidate',
        full_name: 'Demo Candidate'
      }
    ];
    
    log(`\n${colors.blue}Creating demo users...${colors.reset}`);
    
    const createdUsers: any[] = [];
    
    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        log(`${colors.yellow}⚠${colors.reset} User already exists: ${user.email} (${user.role})`);
        createdUsers.push(existingUser);
        continue;
      }
      
      // Create auth user with email verification suppression for dev
      const suppressEmailVerification = process.env.SUPPRESS_EMAIL_VERIFICATION === 'true';
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: suppressEmailVerification,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });
      
      if (authError) {
        log(`${colors.red}✗${colors.reset} Failed to create auth user ${user.email}: ${authError.message}`);
        continue;
      }
      
      // Check if onboarding_completed column exists
      const hasOnboardingColumn = await columnExists(supabase, 'public', 'profiles', 'onboarding_completed')
      
      // Update profile with conditional onboarding_completed field
      const profileUpdate: any = {
        id: authUser.user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        updated_at: new Date().toISOString()
      }
      
      // Set onboarding_completed = true for seeded employers only if column exists
      if (hasOnboardingColumn && (user.role === 'employer' || user.role === 'hr')) {
        profileUpdate.onboarding_completed = true
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate)
        .select()
        .single();
      
      if (profileError) {
        log(`${colors.red}✗${colors.reset} Failed to create profile ${user.email}: ${profileError.message}`);
        continue;
      }
      
      // Add to tenant if employer or hr
      if (user.role === 'employer' || user.role === 'hr') {
        const { error: memberError } = await supabase
          .from('tenant_members')
          .upsert({
            tenant_id: tenantId,
            user_id: authUser.user.id,
            role: user.role,
            joined_at: new Date().toISOString()
          });
        
        if (memberError) {
          log(`${colors.red}✗${colors.reset} Failed to add ${user.email} to tenant: ${memberError.message}`);
        }
      }
      
      createdUsers.push(profile);
      log(`${colors.green}✓${colors.reset} Created user: ${user.email} (${user.role})`);
    }
    
    // 3. Create demo interview
    log(`\n${colors.blue}Creating demo interview...${colors.reset}`);
    
    const employerUser = createdUsers.find(u => u.role === 'employer');
    if (!employerUser) {
      log(`${colors.red}✗${colors.reset} No employer user found, cannot create interview`);
      process.exit(1);
    }
    
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id, title')
      .eq('tenant_id', tenantId)
      .eq('title', 'Frontend Developer Interview')
      .single();
    
    let interviewId: string;
    
    if (existingInterview) {
      interviewId = existingInterview.id;
      log(`${colors.yellow}⚠${colors.reset} Using existing interview: ${existingInterview.title}`);
    } else {
      const { data: newInterview, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          tenant_id: tenantId,
          title: 'Frontend Developer Interview',
          description: 'Technical interview for frontend developer position',
          created_by: employerUser.id,
          settings: {
            duration_minutes: 45,
            questions_count: 3,
            difficulty: 'intermediate'
          }
        })
        .select()
        .single();
      
      if (interviewError) {
        log(`${colors.red}✗${colors.reset} Failed to create interview: ${interviewError.message}`);
        process.exit(1);
      }
      
      interviewId = newInterview.id;
      log(`${colors.green}✓${colors.reset} Created interview: Frontend Developer Interview`);
    }
    
    // 4. Create demo questions
    log(`\n${colors.blue}Creating demo questions...${colors.reset}`);
    
    const demoQuestions = [
      {
        prompt: 'Tell me about your experience with React and modern frontend frameworks.',
        reference_answer: 'Look for experience with React hooks, component lifecycle, state management (Redux/Context), and modern tools like Next.js or Vite.',
        position: 1
      },
      {
        prompt: 'How would you optimize the performance of a React application?',
        reference_answer: 'Key points: code splitting, lazy loading, memoization (React.memo, useMemo), virtual scrolling, bundle analysis, and proper state management.',
        position: 2
      },
      {
        prompt: 'Describe a challenging project you worked on and how you overcame the difficulties.',
        reference_answer: 'Assess problem-solving skills, communication, teamwork, and ability to learn from challenges.',
        position: 3
      }
    ];
    
    const createdQuestions: any[] = [];
    
    for (const question of demoQuestions) {
      const { data: existingQuestion } = await supabase
        .from('questions')
        .select('id, prompt')
        .eq('interview_id', interviewId)
        .eq('prompt', question.prompt)
        .single();
      
      if (existingQuestion) {
        log(`${colors.yellow}⚠${colors.reset} Question already exists: ${question.prompt.substring(0, 50)}...`);
        createdQuestions.push(existingQuestion);
        continue;
      }
      
      const { data: newQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          interview_id: interviewId,
          ...question
        })
        .select()
        .single();
      
      if (questionError) {
        log(`${colors.red}✗${colors.reset} Failed to create question: ${questionError.message}`);
      } else {
        createdQuestions.push(newQuestion);
        log(`${colors.green}✓${colors.reset} Created question: ${question.prompt.substring(0, 50)}...`);
      }
    }
    
    // 5. Create candidate invitation
    log(`\n${colors.blue}Creating candidate invitation...${colors.reset}`);
    
    const candidateUser = createdUsers.find(u => u.role === 'candidate');
    const inviteToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, token')
      .eq('interview_id', interviewId)
      .eq('candidate_email', 'candidate@demo.com')
      .single();
    
    let finalToken: string;
    
    if (existingInvitation) {
      finalToken = existingInvitation.token;
      log(`${colors.yellow}⚠${colors.reset} Using existing invitation token`);
    } else {
      const { data: newInvitation, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          interview_id: interviewId,
          candidate_email: 'candidate@demo.com',
          token: inviteToken,
          expires_at: expiresAt.toISOString(),
          used: false,
          created_by: employerUser.id
        })
        .select()
        .single();
      
      if (invitationError) {
        log(`${colors.red}✗${colors.reset} Failed to create invitation: ${invitationError.message}`);
        process.exit(1);
      }
      
      finalToken = newInvitation.token;
      log(`${colors.green}✓${colors.reset} Created candidate invitation`);
    }

    // 6. Create HR assignment
    log(`\n${colors.blue}Creating HR assignment...${colors.reset}`);
    
    const hrUser = createdUsers.find(u => u.role === 'hr');
    if (hrUser) {
      const { data: existingAssignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('interview_id', interviewId)
        .eq('reviewer_id', hrUser.id)
        .single();
      
      if (existingAssignment) {
        log(`${colors.yellow}⚠${colors.reset} HR assignment already exists`);
      } else {
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            interview_id: interviewId,
            reviewer_id: hrUser.id,
            assigned_by: employerUser.id
          });
        
        if (assignmentError) {
          log(`${colors.red}✗${colors.reset} Failed to create HR assignment: ${assignmentError.message}`);
        } else {
          log(`${colors.green}✓${colors.reset} Created HR assignment`);
        }
      }
    }

    // 7. Create demo session and responses
    log(`\n${colors.blue}Creating demo session with responses...${colors.reset}`);
    
    if (candidateUser) {
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('interview_id', interviewId)
        .eq('candidate_id', candidateUser.id)
        .single();
      
      let sessionId: string | undefined;
      
      if (existingSession) {
        sessionId = existingSession.id;
        log(`${colors.yellow}⚠${colors.reset} Using existing session`);
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            interview_id: interviewId,
            candidate_id: candidateUser.id,
            status: 'completed',
            started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            completed_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (sessionError) {
          log(`${colors.red}✗${colors.reset} Failed to create session: ${sessionError.message}`);
          return;
        } else {
          sessionId = newSession.id;
          log(`${colors.green}✓${colors.reset} Created demo session`);
        }
      }

      // Create responses for each question
      if (sessionId) {
        const demoResponses = [
          {
            transcript: "I have been working with React for about 3 years now. I started with class components and lifecycle methods, then transitioned to hooks when they were introduced. I'm very comfortable with useState, useEffect, useContext, and custom hooks. I've also worked extensively with Next.js for server-side rendering and static site generation. For state management, I've used both Redux with Redux Toolkit and React Context API depending on the project complexity.",
            audio_url: null,
            duration_seconds: 85
          },
          {
            transcript: "Performance optimization in React is crucial for user experience. I typically start with React DevTools Profiler to identify bottlenecks. Key techniques I use include: memoizing components with React.memo, optimizing re-renders with useMemo and useCallback, implementing code splitting with React.lazy and Suspense, using virtual scrolling for large lists, and optimizing bundle size with webpack-bundle-analyzer. I also ensure proper key props in lists and avoid creating objects in render methods.",
            audio_url: null,
            duration_seconds: 120
          },
          {
            transcript: "Recently, I worked on migrating a legacy jQuery application to React while maintaining backward compatibility. The main challenge was the tight coupling between UI and business logic. I approached this by first creating a component wrapper system that could gradually replace jQuery widgets. I had to coordinate with the backend team to update APIs and ensure data consistency. The key was breaking down the migration into small, testable chunks and maintaining thorough documentation throughout the process.",
            audio_url: null,
            duration_seconds: 95
          }
        ];

        for (let i = 0; i < createdQuestions.length && i < demoResponses.length; i++) {
          const question = createdQuestions[i];
          const response = demoResponses[i];
          
          const { data: existingResponse } = await supabase
            .from('responses')
            .select('id')
            .eq('session_id', sessionId)
            .eq('question_id', question.id)
            .single();
          
          if (existingResponse) {
            log(`${colors.yellow}⚠${colors.reset} Response already exists for question ${i + 1}`);
            continue;
          }
          
          const { data: newResponse, error: responseError } = await supabase
            .from('responses')
            .insert({
              session_id: sessionId,
              question_id: question.id,
              transcript: response.transcript,
              audio_url: response.audio_url,
              duration_seconds: response.duration_seconds
            })
            .select()
            .single();
          
          if (responseError) {
            log(`${colors.red}✗${colors.reset} Failed to create response ${i + 1}: ${responseError.message}`);
          } else {
            log(`${colors.green}✓${colors.reset} Created response for question ${i + 1}`);
            
            // Create evaluation for HR demo
            if (hrUser && newResponse) {
              const scores = [8, 7, 9]; // Demo scores
              const notes = [
                "Strong technical knowledge of React ecosystem. Good understanding of hooks and modern patterns.",
                "Excellent grasp of performance optimization techniques. Mentioned key strategies like memoization and code splitting.",
                "Great problem-solving approach. Shows ability to break down complex problems and work collaboratively."
              ];
              
              const { error: evalError } = await supabase
                .from('evaluations')
                .insert({
                  response_id: newResponse.id,
                  reviewer_id: hrUser.id,
                  score: scores[i],
                  notes: notes[i]
                });
              
              if (evalError) {
                log(`${colors.red}✗${colors.reset} Failed to create evaluation ${i + 1}: ${evalError.message}`);
              } else {
                log(`${colors.green}✓${colors.reset} Created evaluation for question ${i + 1}`);
              }
            }
          }
        }
      }
    }
    
    // Success summary
    log(`\n${colors.cyan}🎉 Demo Data Seeded Successfully!${colors.reset}\n`);
    
    log(`${colors.blue}Demo Users Created:${colors.reset}`);
    log(`  Employer: employer@demo.com / demo123456`);
    log(`  HR:       hr@demo.com / demo123456`);
    log(`  Candidate: candidate@demo.com / demo123456`);
    
    log(`\n${colors.blue}Demo Interview:${colors.reset}`);
    log(`  Title: Frontend Developer Interview`);
    log(`  Questions: 3 demo questions created`);
    log(`  Sample responses and evaluations created`);
    
    log(`\n${colors.green}🔗 Candidate Invitation Link:${colors.reset}`);
    log(`${colors.cyan}http://localhost:3000/candidate?token=${finalToken}${colors.reset}`);
    
    log(`\n${colors.green}🎯 Embed Widget Testing:${colors.reset}`);
    log(`${colors.cyan}http://localhost:3000/embed/test?token=${finalToken}${colors.reset}`);
    log(`  CDN URL: http://localhost:3001/cdn/embed/embed.min.js`);
    log(`  Token API: http://localhost:3001/api/embed/token`);
    log(`  Config API: http://localhost:3001/api/embed/config`);
    log(`  Documentation: /docs/embed/`);
    
    log(`\n${colors.blue}📋 Copy-Paste Embed Code:${colors.reset}`);
    log(`${colors.cyan}<script src="http://localhost:3001/cdn/embed/embed.min.js"></script>`);
    log(`<script>`);
    log(`  QscreenInterview.mount({`);
    log(`    el: '#interview-widget',`);
    log(`    inviteToken: '${finalToken}',`);
    log(`    onStart: () => console.log('Interview started'),`);
    log(`    onComplete: (result) => console.log('Completed:', result)`);
    log(`  });`);
    log(`</script>${colors.reset}`);
    
    log(`\n${colors.blue}Dashboard URLs:${colors.reset}`);
    log(`  Employer: http://localhost:3000/employer`);
    log(`  HR: http://localhost:3000/hr`);
    log(`  Login: http://localhost:3000/auth/login`);
    
    log(`\n${colors.green}🚀 Quick Start Commands:${colors.reset}`);
    log(`  Start backend: ${colors.cyan}cd apps/server && pnpm dev${colors.reset}`);
    log(`  Start frontend: ${colors.cyan}cd apps/web && pnpm dev${colors.reset}`);
    log(`  Start conductor: ${colors.cyan}cd apps/conductor && pnpm dev${colors.reset}`);
    log(`  Run all: ${colors.cyan}pnpm dev${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Unexpected error: ${error}`);
    process.exit(1);
  }
}

main().catch(console.error);
