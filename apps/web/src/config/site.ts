import { z } from 'zod'

// Validation schema for site content
export const siteContentSchema = z.object({
  // SEO and metadata
  site: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
  }),

  // Landing page content
  landing: z.object({
    hero: z.object({
      title: z.string(),
      subtitle: z.string(),
      image: z.object({
        src: z.string(),
        alt: z.string(),
      }),
    }),
    features: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string(), // Heroicon name
    })).min(1),
    cta: z.object({
      employer: z.object({
        text: z.string(),
        href: z.string(),
      }),
      candidate: z.object({
        text: z.string(),
        href: z.string(),
      }),
    }),
  }),

  // Default theme (can be overridden per tenant)
  theme: z.object({
    colors: z.object({
      primary: z.string(),
      background: z.string(),
      text: z.string(),
    }),
  }),
})

// Type inference from schema
export type SiteContent = z.infer<typeof siteContentSchema>

// Default site content
export const siteContent: SiteContent = {
  site: {
    name: 'Interview Platform',
    description: 'Professional online interview platform for employers and candidates',
    url: 'https://example.com',
  },
  landing: {
    hero: {
      title: 'Interview your candidates, live and online.',
      subtitle: 'Structured questions, instant feedback for your team, and seamless scheduling.',
      image: {
        src: '/images/hero.svg',
        alt: 'Online interview illustration',
      },
    },
    features: [
      {
        title: 'Live Voice Interview',
        description: 'Natural conversation flow with clear audio quality',
        icon: 'microphone',
      },
      {
        title: 'Instant Notes',
        description: 'Automatic transcription and key point summaries',
        icon: 'document-text',
      },
      {
        title: 'Team Review Dashboard',
        description: 'Collaborate on candidate evaluations in real-time',
        icon: 'chart-bar',
      },
      {
        title: 'Secure & Private',
        description: 'Enterprise-grade security for your interviews',
        icon: 'shield-check',
      },
    ],
    cta: {
      employer: {
        text: 'For Employers',
        href: '/employer',
      },
      candidate: {
        text: 'Join Interview',
        href: '/candidate',
      },
    },
  },
  theme: {
    colors: {
      primary: '#2563eb',
      background: '#ffffff',
      text: '#111827',
    },
  },
}

// Validate content at runtime
siteContentSchema.parse(siteContent)
