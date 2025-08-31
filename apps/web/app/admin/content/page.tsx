import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Edit, FileText } from 'lucide-react'
import siteContent from '@/content/site.json'

export default function AdminContentPage() {
  // Only allow access in non-production
  if (process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Management</h1>
        <p className="text-gray-600">
          Preview and manage site content. Edit <code className="bg-gray-100 px-2 py-1 rounded">content/site.json</code> to update content.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Site Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Site Name</label>
                <p className="text-lg font-semibold">{siteContent.site.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tagline</label>
                <p>{siteContent.site.tagline}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p>{siteContent.site.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>Main landing page content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Title</label>
                <p className="text-2xl font-bold">{siteContent.hero.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subtitle</label>
                <p>{siteContent.hero.subtitle}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Call-to-Action Buttons</label>
                <div className="flex gap-2 mt-2">
                  <Button>{siteContent.hero.cta.primary.label}</Button>
                  <Button variant="outline">{siteContent.hero.cta.secondary.label}</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Main navigation and auth links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Main Navigation</label>
                <div className="flex gap-2 mt-2">
                  {siteContent.navigation.main.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Auth Links</label>
                <div className="flex gap-2 mt-2">
                  {siteContent.navigation.auth.map((item, index) => (
                    <Badge key={index} variant="outline">
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>{siteContent.features.length} features configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {siteContent.features.map((feature, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{feature.icon}</Badge>
                    <h4 className="font-semibold">{feature.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Plans</CardTitle>
            <CardDescription>{siteContent.pricing.plans.length} plans configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {siteContent.pricing.plans.map((plan, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-4">Popular</Badge>
                  )}
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-lg">{plan.name}</h4>
                    <div className="text-2xl font-bold">{plan.price}</div>
                    <div className="text-sm text-gray-500">{plan.period}</div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  <ul className="text-sm space-y-1 mb-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle>Footer Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Footer Links</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {siteContent.footer.links.map((link, index) => (
                    <Badge key={index} variant="secondary">
                      {link.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Social Links</label>
                <div className="flex gap-2 mt-2">
                  {siteContent.footer.social.map((social, index) => (
                    <Badge key={index} variant="outline">
                      {social.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Instructions */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              How to Edit Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Edit the <code className="bg-gray-100 px-2 py-1 rounded">content/site.json</code> file</p>
              <p>2. Restart the development server to see changes</p>
              <p>3. Use this page to preview your changes</p>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="/debug/env" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Debug Dashboard
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
