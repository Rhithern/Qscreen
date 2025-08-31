"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building2,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SiteContent } from "@/lib/content";

interface GlobalHeaderProps {
  siteContent?: SiteContent;
}

export function GlobalHeader({ siteContent }: GlobalHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Fallback content if not provided
  const content = siteContent || {
    brand: { name: "InterviewPro", tagline: "Interview platform" },
    header: { menus: [] },
    hero: { headline: "", subheadline: "", primaryCta: { label: "", href: "" }, secondaryCta: { label: "", href: "" } },
    footer: { columns: [], social: [] }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt={`${content.brand.name} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8 transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-display font-semibold text-gray-900 tracking-tight">
                  {content.brand.name}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {content.header.menus.map((menu) => (
              <div key={menu.label} className="relative">
                {menu.href ? (
                  <Link
                    href={menu.href}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    {menu.label}
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                      >
                        <span>{menu.label}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2" align="start">
                      {menu.items?.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="flex flex-col items-start p-3 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </nav>

          {/* Auth buttons and user menu */}
          <div className="flex items-center space-x-3">
            {/* Auth buttons for non-authenticated users */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register/employer"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Get started
              </Link>
            </div>

            {/* User menu (when authenticated) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/employer" className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50">
            <div className="px-2 pt-4 pb-6 space-y-2">
              {content.header.menus.map((menu) => (
                <div key={menu.label}>
                  {menu.href ? (
                    <Link
                      href={menu.href}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {menu.label}
                    </Link>
                  ) : (
                    <div>
                      <button
                        className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setActiveDropdown(activeDropdown === menu.label ? null : menu.label)}
                        aria-expanded={activeDropdown === menu.label}
                      >
                        <span>{menu.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === menu.label ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === menu.label && (
                        <div className="mt-2 ml-4 space-y-1">
                          {menu.items?.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setActiveDropdown(null);
                              }}
                            >
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile auth buttons */}
              <div className="pt-4 border-t border-gray-200/50 space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register/employer"
                  className="block bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
