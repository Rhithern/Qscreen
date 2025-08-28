import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { siteContent, type SiteContent } from '@/config/site'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 -z-10" />
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-6">
                {siteContent.landing.hero.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {siteContent.landing.hero.subtitle}
              </p>
              <div className="flex gap-4">
                <Link href={siteContent.landing.cta.employer.href}>
                  <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    {siteContent.landing.cta.employer.text}
                  </Button>
                </Link>
                <Link href={siteContent.landing.cta.candidate.href}>
                  <Button size="lg" variant="outline">
                    {siteContent.landing.cta.candidate.text}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <Image
                src={siteContent.landing.hero.image.src}
                alt={siteContent.landing.hero.image.alt}
                fill
                className="object-contain p-8"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {siteContent.landing.features.map((feature: SiteContent['landing']['features'][0], index: number) => (
              <Card key={index} className="bg-background/50 backdrop-blur">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <use href={`/icons/heroicons.svg#${feature.icon}`} />
                    </svg>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

