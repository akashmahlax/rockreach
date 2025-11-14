import { Search, Sparkles, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "Natural Language Search",
    description:
      "Just describe who you're looking for in plain English. Our AI understands context and finds the perfect prospects.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Enrichment",
    description:
      "Automatically verify emails, find phone numbers, and enrich profiles with social links and job history.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Mail,
    title: "Personalized Outreach",
    description:
      "Generate personalized emails for each prospect using AI. Send campaigns at scale with tracking and analytics.",
    gradient: "from-orange-500 to-red-500",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Everything you need to scale outreach
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            From discovery to conversion, we&apos;ve built the tools you need to find and connect with your ideal customers.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
