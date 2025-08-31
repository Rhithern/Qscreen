import { getSiteContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const siteContent = getSiteContent();

  const contactInfo = [
    {
      icon: Mail,
      title: "Email us",
      description: "Our team typically responds within 24 hours",
      contact: "hello@interviewpro.com"
    },
    {
      icon: Phone,
      title: "Call us",
      description: "Mon-Fri from 8am to 6pm PST",
      contact: "+1 (555) 123-4567"
    },
    {
      icon: MapPin,
      title: "Visit us",
      description: "Come say hello at our office",
      contact: "123 Innovation Drive, San Francisco, CA 94107"
    },
    {
      icon: Clock,
      title: "Office hours",
      description: "Monday to Friday",
      contact: "8:00 AM to 6:00 PM PST"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-5xl">
              Get in touch
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about {siteContent.brand.name}? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact form */}
          <div className="glass-card p-8 rounded-2xl">
            <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
              Send us a message
            </h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First name
                  </label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last name
                  </label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <Input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <Button type="submit" className="w-full">
                Send message
              </Button>
            </form>
          </div>

          {/* Contact information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
                Contact information
              </h2>
              <p className="text-gray-600 mb-8">
                We're here to help and answer any question you might have. 
                We look forward to hearing from you.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-1">
                        {item.description}
                      </p>
                      <p className="text-gray-900 font-medium">
                        {item.contact}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FAQ section */}
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Frequently asked questions
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    How quickly do you respond to inquiries?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    We typically respond to all inquiries within 24 hours during business days.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Do you offer phone support?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Yes, phone support is available for all paid plans during business hours.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Can I schedule a demo?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Absolutely! Mention "demo request" in your message and we'll set up a personalized walkthrough.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
