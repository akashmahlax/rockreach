import { Card } from "@/components/ui/card";

const stats = [
  { value: "50M+", label: "Verified Profiles" },
  { value: "99.9%", label: "Email Accuracy" },
  { value: "10x", label: "Faster Than Manual" },
  { value: "24/7", label: "AI Assistant" },
];

export function Stats() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Trusted by growth teams worldwide
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Join thousands of companies accelerating their sales pipeline
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700 text-center p-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-300 text-lg">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
