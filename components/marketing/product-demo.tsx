"use client";

import Image from "next/image";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const demoScreenshots = [
  {
    id: "search",
    label: "Smart Search",
    title: "Natural language queries that just work",
    description: "Describe your ideal prospect in plain English. Our AI translates your intent into precise filters.",
    image: "/leads.png",
  },
  {
    id: "profiles",
    label: "Lead Profiles",
    title: "Complete contact information",
    description: "Get verified emails, phone numbers, LinkedIn profiles, and company details for every lead.",
    image: "/analytics-dashboard-with-charts-graphs-and-data-vi.jpg",
  },
  {
    id: "outreach",
    label: "Email Campaigns",
    title: "Personalized at scale",
    description: "AI generates unique, contextual emails for each prospect. Send campaigns and track engagement.",
    image: "/data-visualization-dashboard-with-interactive-char.jpg",
  },
];

export function ProductDemo() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            See it in action
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Watch how Logician transforms your lead generation workflow
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            {demoScreenshots.map((demo) => (
              <TabsTrigger key={demo.id} value={demo.id} className="text-sm">
                {demo.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {demoScreenshots.map((demo) => (
            <TabsContent key={demo.id} value={demo.id} className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    {demo.title}
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {demo.description}
                  </p>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-200">
                  <Image
                    src={demo.image}
                    alt={demo.title}
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    priority={demo.id === "search"}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
