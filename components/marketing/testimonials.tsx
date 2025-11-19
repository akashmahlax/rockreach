import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Head of Sales",
    company: "TechFlow Inc",
    avatar: "/leads.png",
    content:
      "Logician cut our lead research time by 80%. We went from manual LinkedIn searches to finding hundreds of qualified prospects in minutes.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Founder",
    company: "GrowthLabs",
    avatar: "/leads.png",
    content:
      "The AI-powered email generation is incredible. Each message feels personal and relevant. Our response rates doubled within the first month.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Growth Manager",
    company: "SaaS Ventures",
    avatar: "/leads.png",
    content:
      "Best investment for our sales team. The natural language search is intuitive, and the data quality is unmatched. Highly recommend!",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-medium text-foreground mb-4 font-serif text-balance">
            Loved by sales teams
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans text-balance">
            Don&apos;t just take our word for it—here&apos;s what our customers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-sm bg-background/50 backdrop-blur-sm hover:bg-background transition-colors duration-300">
              <CardContent className="pt-8 px-8 pb-8">
                {/* Rating */}
                <div className="flex gap-0.5 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="text-lg text-foreground leading-relaxed mb-8 font-serif italic">
                  &quot;{testimonial.content}&quot;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-serif">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground font-sans text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground font-sans">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
