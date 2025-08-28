'use client'

import { useAuth } from '@/lib/auth-provider'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon?: React.ReactNode
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

export function Sidebar() {
  const { profile } = useAuth()

  if (!profile) return null

  const sidebarItems = {
    employer: [
      { href: '/employer', title: 'Dashboard' },
      { href: '/employer/interviews', title: 'Interviews' },
      { href: '/employer/candidates', title: 'Candidates' },
      { href: '/employer/settings/branding', title: 'Branding' },
      { href: '/employer/settings/team', title: 'Team' },
    ],
    hr: [
      { href: '/hr', title: 'Dashboard' },
      { href: '/hr/interviews', title: 'Interviews' },
      { href: '/hr/candidates', title: 'Candidates' },
    ],
    candidate: [
      { href: '/candidate', title: 'Interviews' },
      { href: '/candidate/completed', title: 'Completed' },
    ],
  }[profile.role]

  return (
    <aside className="hidden lg:block fixed z-30 inset-y-0 left-0 w-64 border-r bg-background px-4 py-8">
      <SidebarNav items={sidebarItems} />
    </aside>
  )
}
