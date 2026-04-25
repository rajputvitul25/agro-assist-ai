import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Calendar,
  Camera,
  Leaf,
  MessageCircle,
  Sprout,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

const quickTools = [
  {
    icon: Leaf,
    title: "Crop Recommendation",
    hint: "Fast crop guidance",
  },
  {
    icon: Camera,
    title: "Crop Health Scan",
    hint: "Upload and check",
  },
  {
    icon: Calendar,
    title: "Sowing Calendar",
    hint: "Season timing",
  },
  {
    icon: MessageCircle,
    title: "Chatbot Help",
    hint: "Ask in Hindi or English",
  },
];

const metrics = [
  { value: "4", label: "Core tools" },
  { value: "2", label: "Languages" },
  { value: "24/7", label: "Instant access" },
];

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(246,251,244,1)_0%,rgba(235,245,232,1)_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,122,55,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(173,199,86,0.2),transparent_30%)]" />
      <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-left">
            <Badge className="mb-5 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-primary shadow-sm">
              <Sprout className="mr-2 h-3.5 w-3.5" />
              Smart Farmer Dashboard
            </Badge>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Better farming decisions,
              <span className="block text-primary">without the clutter.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Recommendations, crop health scans, updates, calendars, and chatbot support in one clean workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-full px-7 text-base shadow-lg shadow-primary/20"
                onClick={() => navigate("/crop-recommendation")}
              >
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-primary/20 bg-white/70 px-7 text-base backdrop-blur"
                onClick={() => navigate("/crop-monitoring")}
              >
                Start Health Scan
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur"
                >
                  <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-primary/15 via-accent/20 to-transparent blur-2xl" />
            <Card className="relative overflow-hidden rounded-[30px] border-white/70 bg-white/80 shadow-2xl backdrop-blur-xl">
              <div className="relative h-64 overflow-hidden border-b border-border/60">
                <img
                  src={heroImage}
                  alt="Green farmland"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-primary shadow-sm">
                  All-in-one workspace
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/20 bg-white/12 p-4 text-white backdrop-blur-md">
                  <div className="text-sm font-medium text-white/80">Quick overview</div>
                  <div className="mt-1 text-xl font-semibold">Tools that feel connected, not scattered.</div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {quickTools.map((tool) => (
                  <div
                    key={tool.title}
                    className="rounded-3xl border border-border/70 bg-background/90 p-4 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{tool.title}</div>
                        <div className="text-sm text-muted-foreground">{tool.hint}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
