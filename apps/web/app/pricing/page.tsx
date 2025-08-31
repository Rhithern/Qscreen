import { getSiteContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const siteContent = getSiteContent();

  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      description: "Perfect for small teams",
      features: [
        "Up to 10 interviews/month",
        "2 team members",
        "Basic reporting",
        "Email support"
      ],
      cta: "Start Free Trial",
      href: "/auth/register"
    },
    {
      name: "Professional",
      price: "$99",
      period: "per month",
      description: "For growing companies",
      features: [
        "Unlimited interviews",
        "Up to 10 team members",
        "Advanced reporting",
        "Priority support",
        "Custom branding"
      ],
      cta: "Start Free Trial",
      href: "/auth/register",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large organizations",
      features: [
        "Unlimited everything",
        "Unlimited team members",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      href: "/contact"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for your team. Start with a free trial, no credit card required.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border ${
                plan.popular 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-gray-200'
              } p-8 hover:shadow-lg transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-display font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button 
                  asChild 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  <Link href={plan.href}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className="mt-24">
          <h2 className="text-3xl font-display font-bold text-center text-gray-900 mb-12">
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Yes, all plans come with a 14-day free trial. No credit card required to get started.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and can arrange invoicing for Enterprise customers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. Your access continues until the end of your billing period.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
