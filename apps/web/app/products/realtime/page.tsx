import { getSiteContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Mic, Video, MessageSquare, Users, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function RealtimeInterviewPage() {
  const siteContent = getSiteContent();

  const features = [
    {
      icon: Video,
      title: "HD Video & Audio",
      description: "Crystal clear video calls with adaptive quality and noise cancellation."
    },
    {
      icon: MessageSquare,
      title: "Live Captions",
      description: "Real-time transcription and captions for better accessibility and note-taking."
    },
    {
      icon: Users,
      title: "Multi-participant",
      description: "Support for multiple interviewers and panel interviews with seamless coordination."
    },
    {
      icon: Zap,
      title: "Instant Connection",
      description: "One-click join with no downloads required. Works in any modern browser."
    },
    {
      icon: Mic,
      title: "Smart Audio",
      description: "Advanced audio processing with echo cancellation and background noise reduction."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "End-to-end encryption with enterprise-grade security and compliance."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero section */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-6xl">
              Realtime Interview
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with candidates instantly through our high-quality video platform. 
              Designed for seamless, professional interviews with real-time collaboration features.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Start free trial
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  Schedule demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Professional video interviews made simple
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our realtime platform provides everything you need for smooth, 
            professional video interviews that work reliably every time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="glass-card p-8 rounded-2xl hover:shadow-lg transition-all duration-200">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-primary" />
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

      {/* Technical specs section */}
      <div className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Built for reliability and performance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform is engineered to deliver consistent, high-quality 
              interview experiences regardless of network conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-600">Uptime guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">&lt;50ms</div>
              <div className="text-gray-600">Average latency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1080p</div>
              <div className="text-gray-600">HD video quality</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Global data centers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Use cases section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Perfect for every interview scenario
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're conducting one-on-one interviews or complex panel discussions, 
            our platform adapts to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              One-on-one interviews
            </h3>
            <p className="text-gray-600">
              Perfect for initial screenings and detailed technical interviews 
              with focused, personal interaction.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Panel interviews
            </h3>
            <p className="text-gray-600">
              Coordinate multiple interviewers seamlessly with shared controls 
              and collaborative note-taking features.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Quick screenings
            </h3>
            <p className="text-gray-600">
              Rapid candidate evaluation with instant connection and 
              streamlined interview workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Integration section */}
      <div className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
                Seamless integration with your workflow
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Calendar sync</h3>
                    <p className="text-gray-600">Automatic integration with Google Calendar, Outlook, and other scheduling tools.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">ATS integration</h3>
                    <p className="text-gray-600">Connect with popular applicant tracking systems for seamless candidate management.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Recording & transcripts</h3>
                    <p className="text-gray-600">Automatic recording with searchable transcripts and highlight reels.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Mobile ready</h3>
                    <p className="text-gray-600">Full functionality on mobile devices for interviews on the go.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="glass-card p-8 rounded-2xl">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Trusted by leading companies
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-4 text-gray-400">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-gray-400">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary/5 border-t border-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Start interviewing in real-time today
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience the difference of professional, reliable video interviews. 
              No setup required, works in any browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Try it free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  Book a demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
