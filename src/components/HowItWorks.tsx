import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ScanSearch, Smartphone, Upload } from "lucide-react";
import weatherTech from "@/assets/weather-tech.jpg";

const steps = [
  {
    icon: Smartphone,
    title: "Pick a tool",
    description: "Recommendation, scan, updates, or calendar.",
    step: "01",
  },
  {
    icon: Upload,
    title: "Add your input",
    description: "Enter values or upload an image.",
    step: "02",
  },
  {
    icon: ScanSearch,
    title: "Check the result",
    description: "See the answer in a clear format.",
    step: "03",
  },
  {
    icon: CheckCircle,
    title: "Use it right away",
    description: "Move to the next action without extra pages.",
    step: "04",
  },
];

const chips = ["Crop guidance", "Leaf scan", "Gov updates", "Voice chatbot"];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden rounded-[34px] border-white/70 bg-[linear-gradient(135deg,rgba(236,244,232,1)_0%,rgba(248,251,245,1)_45%,rgba(255,255,255,1)_100%)] shadow-xl">
          <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative border-b border-border/60 p-8 lg:border-b-0 lg:border-r lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,122,55,0.16),transparent_34%)]" />
              <div className="relative">
                <Badge className="rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-primary">
                  Simple flow
                </Badge>
                <h2 className="mt-5 text-3xl font-bold text-foreground md:text-4xl">
                  Less searching, more doing.
                </h2>
                <p className="mt-4 max-w-md text-lg leading-8 text-muted-foreground">
                  The homepage should feel active and useful, so the flow is now packed into one stronger section.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <div
                      key={chip}
                      className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-sm text-foreground shadow-sm"
                    >
                      {chip}
                    </div>
                  ))}
                </div>

                <div className="mt-8 overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-lg">
                  <img
                    src={weatherTech}
                    alt="Field technology"
                    className="h-52 w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="relative p-8 lg:p-10">
              <div className="absolute left-12 right-12 top-[72px] hidden h-px bg-primary/20 lg:block" />
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {steps.map((step) => (
                  <div
                    key={step.step}
                    className="relative rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-semibold text-primary">{step.step}</div>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default HowItWorks;
