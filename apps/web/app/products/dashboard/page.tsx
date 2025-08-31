import { getSiteContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, FileText, Calendar, TrendingUp, Filter } from "lucide-react";
import Link from "next/link";

export default function ReviewDashboardPage() {
  const siteContent = getSiteContent();

  const features = [
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track interview performance, candidate scores, and hiring metrics in real-time."
    },
    {
      icon: Users,
      title: "Candidate Pipeline",
      description: "Visualize your entire hiring funnel with detailed candidate progression tracking."
    },
    {
      icon: FileText,
      title: "Evaluation Reports",
      description: "Generate comprehensive reports with interviewer feedback and scoring data."
    },
    {
      icon: Calendar,
      title: "Interview Scheduling",
      description: "Manage all interview schedules with calendar integration and automated reminders."
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Identify trends and optimize your hiring process with data-driven insights."
    },
    {
      icon: Filter,
      title: "Advanced Filtering",
      description: "Filter and sort candidates by skills, experience, scores, and custom criteria."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero section */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-6xl">
              Review Dashboard
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Make data-driven hiring decisions with comprehensive analytics and insights. 
              Track, evaluate, and optimize your entire interview process from one central dashboard.
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
            Complete visibility into your hiring process
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our Review Dashboard provides all the tools and insights you need to 
            evaluate candidates effectively and make confident hiring decisions.
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

      {/* Dashboard preview section */}
      <div className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Everything you need in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get a complete overview of your hiring pipeline with intuitive 
              visualizations and actionable insights.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">156</div>
                <div className="text-gray-600">Active candidates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">23</div>
                <div className="text-gray-600">Interviews this week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">4.2</div>
                <div className="text-gray-600">Average candidate score</div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Sarah Johnson completed interview</div>
                      <div className="text-sm text-gray-500">Frontend Developer position • 2 hours ago</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">Score: 4.5/5</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Interview scheduled</div>
                      <div className="text-sm text-gray-500">Backend Engineer position • Tomorrow 2:00 PM</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-600">Upcoming</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
              Make better hiring decisions faster
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Data-driven decisions</h3>
                  <p className="text-gray-600">Use comprehensive analytics and scoring to make objective hiring choices.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Team collaboration</h3>
                  <p className="text-gray-600">Share feedback and coordinate with hiring team members in real-time.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Process optimization</h3>
                  <p className="text-gray-600">Identify bottlenecks and improve your hiring workflow with actionable insights.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Compliance tracking</h3>
                  <p className="text-gray-600">Maintain detailed records and ensure compliance with hiring regulations.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="glass-card p-8 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">60%</div>
                <div className="text-gray-600 mb-6">Faster decision making</div>
                <div className="text-4xl font-bold text-primary mb-2">89%</div>
                <div className="text-gray-600 mb-6">Hiring accuracy improvement</div>
                <div className="text-4xl font-bold text-primary mb-2">45%</div>
                <div className="text-gray-600">Reduction in time-to-hire</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration section */}
      <div className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Integrates with your existing tools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect seamlessly with your current HR tech stack for a unified hiring experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ATS Integration
              </h3>
              <p className="text-gray-600">
                Sync with popular applicant tracking systems like Greenhouse, 
                Lever, and BambooHR.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Analytics Tools
              </h3>
              <p className="text-gray-600">
                Export data to business intelligence tools like Tableau, 
                PowerBI, and Google Analytics.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Calendar Sync
              </h3>
              <p className="text-gray-600">
                Automatic synchronization with Google Calendar, Outlook, 
                and other scheduling platforms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary/5 border-t border-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Transform your hiring with data-driven insights
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Start making better hiring decisions today with our comprehensive 
              Review Dashboard. Get complete visibility into your process.
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
