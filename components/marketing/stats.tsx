import { Card } from "@/components/ui/card";

const stats = [
  { value: "50M+", label: "Verified Profiles" },
  { value: "99.9%", label: "Email Accuracy" },
  { value: "10x", label: "Faster Than Manual" },
  { value: "24/7", label: "AI Assistant" },
];

export function Stats() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background border-y border-border/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-medium mb-4 font-serif text-foreground text-balance">
            Trusted by growth teams worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans text-balance">
            Join thousands of companies accelerating their sales pipeline with precision data.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-5xl sm:text-6xl font-medium text-primary mb-2 font-serif tracking-tight group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm font-medium uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
