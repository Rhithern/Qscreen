import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getSiteContent } from '../lib/content';
import { Video, FileText, Users, Shield, Star, ArrowRight } from 'lucide-react';

export function HomePage() {
  const siteContent = getSiteContent();

  const features = [
    {
      icon: Video,
      title: "Live Interviews",
      description: "Real-time video conversations with crystal clear quality and professional tools."
    },
    {
      icon: FileText,
      title: "Smart Notes",
      description: "Automatic transcription and collaborative note-taking during interviews."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Multiple reviewers can evaluate candidates together in real-time."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security with end-to-end encryption and compliance."
    }
  ];

  const testimonials = [
    {
      quote: "InterviewPro transformed our hiring process. We're making better decisions faster than ever.",
      author: "Sarah Chen",
      role: "Head of Talent",
      company: "TechCorp"
    },
    {
      quote: "The real-time collaboration features are game-changing for our distributed team.",
      author: "Michael Rodriguez", 
      role: "Engineering Manager",
      company: "StartupXYZ"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              {siteContent.hero.headline}
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              {siteContent.hero.subheadline}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-4">
                <Link to={siteContent.hero.primaryCta.href}>
                  {siteContent.hero.primaryCta.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
                <Link to={siteContent.hero.secondaryCta.href}>
                  {siteContent.hero.secondaryCta.label}
                </Link>
              </Button>
            </div>

            <div className="mt-8 text-sm text-gray-600 space-y-2">
              <p>
                Candidates: Have an invitation token?{' '}
                <Link to="/candidate" className="text-primary hover:underline font-medium">
                  Click here to start
                </Link>
              </p>
              <p>
                <Link to="/auth/login" className="text-primary hover:underline font-medium">
                  Already have an account? Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-8">Trusted by leading companies worldwide</p>
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
              Everything you need for professional interviews
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your hiring process with powerful tools designed for modern teams.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="glass-card p-8 rounded-2xl text-center hover:shadow-lg transition-all duration-200">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
              Trusted by thousands of companies
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-gray-600">Interviews conducted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Companies trust us</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-gray-600">Customer satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
              What our customers say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-600">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl mb-4">
              Ready to transform your hiring?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of companies already using {siteContent.brand.name} to 
              conduct better interviews and make smarter hiring decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-4">
                <Link to="/auth/register">
                  Start free trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
                <Link to="/contact">
                  Contact sales
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
