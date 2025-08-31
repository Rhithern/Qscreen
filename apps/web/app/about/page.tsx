import { getSiteContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Users, Target, Award, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const siteContent = getSiteContent();

  const values = [
    {
      icon: Users,
      title: "People First",
      description: "We believe great hiring starts with putting people at the center of the process."
    },
    {
      icon: Target,
      title: "Results Driven",
      description: "Every feature we build is designed to help you make better hiring decisions faster."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We're committed to delivering the highest quality interview experience possible."
    },
    {
      icon: Heart,
      title: "Empathy",
      description: "We understand the challenges of hiring and build solutions with genuine care."
    }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-founder",
      bio: "Former VP of Engineering at TechCorp with 15+ years in talent acquisition.",
      image: "/team/sarah.jpg"
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-founder", 
      bio: "Previously led engineering teams at Scale Inc. Passionate about building great products.",
      image: "/team/michael.jpg"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      bio: "Product leader with expertise in user experience and enterprise software.",
      image: "/team/emily.jpg"
    },
    {
      name: "David Kim",
      role: "Head of Engineering",
      bio: "Full-stack engineer with deep experience in real-time systems and scalability.",
      image: "/team/david.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero section */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-6xl">
              We're building the future of hiring
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Our mission is to help companies find great talent through better interviews. 
              We believe that when hiring is done right, everyone wins.
            </p>
          </div>
        </div>
      </div>

      {/* Story section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
              Our story
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Founded in 2023, {siteContent.brand.name} was born from a simple observation: 
                most interview processes are broken. Candidates struggle with unclear expectations, 
                while hiring teams make decisions based on incomplete information.
              </p>
              <p>
                We set out to fix this by creating a platform that makes interviews more 
                structured, fair, and insightful. Our tools help hiring teams conduct better 
                interviews while giving candidates the best possible experience.
              </p>
              <p>
                Today, we're proud to serve companies of all sizes, from fast-growing startups 
                to Fortune 500 enterprises, helping them build amazing teams through better hiring.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="glass-card p-8 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-gray-600 mb-4">Interviews conducted</div>
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-gray-600 mb-4">Companies trust us</div>
                <div className="text-4xl font-bold text-primary mb-2">95%</div>
                <div className="text-gray-600">Customer satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values section */}
      <div className="bg-gray-50/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Our values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from product decisions to customer support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Meet our team
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're a diverse group of builders, thinkers, and problem-solvers united by our 
            passion for improving how companies hire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.name} className="text-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-primary font-medium mb-2">
                {member.role}
              </p>
              <p className="text-gray-600 text-sm">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary/5 border-t border-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Ready to transform your hiring?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join hundreds of companies already using {siteContent.brand.name} to 
              conduct better interviews and make smarter hiring decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Get started free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  Contact sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
