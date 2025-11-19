"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-medium mb-6 font-serif text-balance tracking-tight">
          Ready to transform your business?
        </h2>
        <p className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto font-sans text-balance leading-relaxed">
          Join thousands of businesses streamlining their operations,
          managing schedules, and growing with data-driven insights.
        </p>
        <Button asChild size="lg" variant="secondary" className="px-8 py-6 text-lg font-medium font-sans shadow-lg hover:shadow-xl transition-all duration-300">
          <Link href="/api/auth/signin">Start for free</Link>
        </Button>
      </div>
    </section>
  )
}
