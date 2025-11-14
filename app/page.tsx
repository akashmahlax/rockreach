import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { ProductDemo } from "@/components/marketing/product-demo"
import { Stats } from "@/components/marketing/stats"
import { Testimonials } from "@/components/marketing/testimonials"
import PricingSection from "@/components/marketing/pricing"
import FAQSection from "@/components/marketing/faq"
import CTASection from "@/components/marketing/cta"
import FooterSection from "@/components/marketing/footer"

export default async function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-linear-to-t from-amber-200 to-white">
      <Hero />
      <Features />
      <ProductDemo />
      <Stats />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
