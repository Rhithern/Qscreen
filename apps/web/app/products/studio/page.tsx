import { getSiteContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Video, Users, FileText, BarChart3, Settings, Clock } from "lucide-react";
import Link from "next/link";

export default function InterviewStudioPage() {
  const siteContent = getSiteContent();

  const features = [
    {
      icon: Video,
      title: "Live Video Interviews",
      description: "High-quality video calls with screen sharing and recording capabilities."
    },
    {
      icon: FileText,
      title: "Structured Questions",
      description: "Pre-built question banks and custom interview templates for consistent evaluation."
    },
    {
      icon: Users,
      title: "Multi-interviewer Support",
      description: "Collaborate with team members during interviews with real-time notes and scoring."
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track interview performance and candidate engagement metrics live."
    },
    {
      icon: Settings,
      title: "Customizable Workflows",
      description: "Tailor the interview process to match your company's hiring methodology."
    },
    {
      icon: Clock,
      title: "Automated Scheduling",
      description: "Smart calendar integration with automatic timezone detection and reminders."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero section */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-6xl">
              Interview Studio
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Create and manage professional interview sessions with our comprehensive studio platform. 
              Everything you need to conduct structured, fair, and insightful interviews.
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
            Everything you need for better interviews
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our Interview Studio provides all the tools and features you need to conduct 
            professional, structured interviews that lead to better hiring decisions.
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

      {/* How it works section */}
      <div className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              How Interview Studio works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get up and running in minutes with our intuitive interview management platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Set up your interview
              </h3>
              <p className="text-gray-600">
                Choose from pre-built templates or create custom question sets. 
                Invite team members and schedule sessions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Conduct the interview
              </h3>
              <p className="text-gray-600">
                Use our live interview platform with video, screen sharing, 
                real-time notes, and collaborative scoring.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Review and decide
              </h3>
              <p className="text-gray-600">
                Access detailed analytics, team feedback, and recordings 
                to make informed hiring decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
              Why teams choose Interview Studio
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Reduce bias</h3>
                  <p className="text-gray-600">Structured interviews and standardized scoring help eliminate unconscious bias.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Save time</h3>
                  <p className="text-gray-600">Automated scheduling, templates, and workflows reduce administrative overhead.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Better decisions</h3>
                  <p className="text-gray-600">Data-driven insights and team collaboration lead to more informed hiring choices.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Candidate experience</h3>
                  <p className="text-gray-600">Professional, smooth interview process that reflects well on your company brand.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="glass-card p-8 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">85%</div>
                <div className="text-gray-600 mb-6">Faster hiring decisions</div>
                <div className="text-4xl font-bold text-primary mb-2">92%</div>
                <div className="text-gray-600 mb-6">Interviewer satisfaction</div>
                <div className="text-4xl font-bold text-primary mb-2">40%</div>
                <div className="text-gray-600">Reduction in time-to-hire</div>
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
              Ready to transform your interviews?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Start conducting better interviews today with Interview Studio. 
              No setup required, get started in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Start free trial
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">
                  View pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
