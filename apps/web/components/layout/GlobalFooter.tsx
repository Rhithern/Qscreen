"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Linkedin, Twitter } from "lucide-react";
import { SiteContent } from "@/lib/content";

interface GlobalFooterProps {
  siteContent?: SiteContent;
}

export function GlobalFooter({ siteContent }: GlobalFooterProps) {
  const currentYear = new Date().getFullYear();

  // Fallback content if not provided
  const content = siteContent || {
    brand: { name: "InterviewPro", tagline: "Interview platform" },
    header: { menus: [] },
    hero: { headline: "", subheadline: "", primaryCta: { label: "", href: "" }, secondaryCta: { label: "", href: "" } },
    footer: { 
      columns: [
        {
          title: "Product",
          links: [
            { label: "Pricing", href: "/pricing" },
            { label: "About", href: "/about" }
          ]
        }
      ], 
      social: [] 
    }
  };

  const getSocialIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'twitter':
        return Twitter;
      case 'linkedin':
        return Linkedin;
      case 'github':
        return Github;
      default:
        return Twitter;
    }
  };

  return (
    <footer className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-200/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          {/* Main footer content */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.svg"
                  alt={`${content.brand.name} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-display font-semibold text-gray-900">
                  {content.brand.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-6 max-w-sm">
                {content.brand.tagline}
              </p>
              
              {/* Social links */}
              {content.footer.social.length > 0 && (
                <div className="flex space-x-4">
                  {content.footer.social.map((social) => {
                    const Icon = getSocialIcon(social.icon);
                    return (
                      <Link
                        key={social.label}
                        href={social.href}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={social.label}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer columns */}
            {content.footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                  {column.title}
                </h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200/50 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              © {currentYear} {content.brand.name}. All rights reserved.
            </div>
            
            {/* Additional legal links */}
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
