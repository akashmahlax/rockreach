"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("annually")

  const pricing = {
    starter: {
      monthly: 0,
      annually: 0,
    },
    professional: {
      monthly: 20,
      annually: 16,
    },
    enterprise: {
      monthly: 200,
      annually: 160,
    },
  }

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals and small teams getting started.",
      features: [
        "Up to 100 leads per month",
        "Basic search functionality",
        "Email verification",
        "Community support",
        "Basic analytics",
      ],
      featured: false,
    },
    {
      name: "Professional",
      description: "Advanced features for growing teams and businesses.",
      features: [
        "Unlimited leads",
        "Advanced search & filters",
        "AI-powered enrichment",
        "Priority support",
        "Advanced analytics",
        "Email campaigns",
        "API access",
        "Custom integrations",
      ],
      featured: true,
    },
    {
      name: "Enterprise",
      description: "Complete solution for large organizations and enterprises.",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom onboarding",
        "Advanced security features",
        "SSO integration",
        "Custom contracts",
        "White-label options",
      ],
      featured: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-border/50 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plans & Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium text-foreground mb-4 font-serif text-balance">
            Choose the perfect plan for your business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans text-balance">
            Scale your operations with flexible pricing that grows with your team.
            Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex items-center p-1 bg-muted/50 rounded-lg border border-border/50">
            <button
              onClick={() => setBillingPeriod("annually")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 font-sans ${
                billingPeriod === "annually"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annually
            </button>
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 font-sans ${
                billingPeriod === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const planKey = plan.name.toLowerCase() as keyof typeof pricing
            const price = pricing[planKey][billingPeriod]
            
            return (
              <Card
                key={plan.name}
                className={`relative border-border/50 shadow-sm hover:shadow-md transition-all duration-300 ${
                  plan.featured ? "ring-1 ring-primary/20 bg-primary/5" : "bg-background"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium font-sans shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl font-serif font-medium">{plan.name}</CardTitle>
                  <CardDescription className="font-sans text-muted-foreground mt-2">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-medium text-foreground font-serif">${price}</span>
                      <span className="text-muted-foreground font-sans text-sm">
                        /{billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    className={`w-full font-sans ${plan.featured ? "" : "variant-outline"}`}
                    variant={plan.featured ? "default" : "outline"}
                    size="lg"
                  >
                    {price === 0 ? "Start for free" : plan.name === "Enterprise" ? "Contact sales" : "Get started"}
                  </Button>
                  <ul className="space-y-4 pt-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                        <span className="text-sm text-muted-foreground font-sans">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
