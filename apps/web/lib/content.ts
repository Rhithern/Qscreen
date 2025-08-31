import { readFileSync } from 'fs';
import { join } from 'path';

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
  };
  header: {
    menus: Array<{
      label: string;
      href?: string;
      items?: Array<{
        label: string;
        href: string;
        description: string;
      }>;
    }>;
  };
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
  };
  footer: {
    columns: Array<{
      title: string;
      links: Array<{
        label: string;
        href: string;
      }>;
    }>;
    social: Array<{
      label: string;
      href: string;
      icon: string;
    }>;
  };
}

let cachedContent: SiteContent | null = null;

const fallbackContent: SiteContent = {
  brand: {
    name: "InterviewPro",
    tagline: "Interview your candidates, live and online."
  },
  header: {
    menus: [
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" }
    ]
  },
  hero: {
    headline: "Hire Better, Faster",
    subheadline: "Connect with candidates through live interviews and make informed hiring decisions.",
    primaryCta: { label: "Get started", href: "/auth/register/employer" },
    secondaryCta: { label: "Contact sales", href: "/contact" }
  },
  footer: {
    columns: [
      {
        title: "Product",
        links: [
          { label: "Pricing", href: "/pricing" }
        ]
      }
    ],
    social: []
  }
};

export function getSiteContent(): SiteContent {
  if (cachedContent) {
    return cachedContent;
  }

  try {
    // Try multiple possible paths
    const possiblePaths = [
      join(process.cwd(), 'content', 'site.json'),
      join(process.cwd(), 'apps', 'web', 'content', 'site.json'),
      join(__dirname, '..', 'content', 'site.json')
    ];

    let content: string | null = null;
    for (const contentPath of possiblePaths) {
      try {
        content = readFileSync(contentPath, 'utf-8');
        break;
      } catch (e) {
        // Continue to next path
      }
    }

    if (content) {
      cachedContent = JSON.parse(content) as SiteContent;
      return cachedContent;
    } else {
      throw new Error('Site content file not found in any expected location');
    }
  } catch (error) {
    console.warn('Failed to load site content, using fallback:', error);
    cachedContent = fallbackContent;
    return cachedContent;
  }
}
