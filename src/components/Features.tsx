import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Camera,
  Megaphone,
  MessageCircle,
  Mic,
  Target,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Crop Recommendation",
    description: "Compare soil and climate inputs in one focused flow.",
    route: "/crop-recommendation",
    action: "Open tool",
    span: "lg:col-span-5",
    surface:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(232,246,233,0.96)_100%)]",
  },
  {
    icon: Camera,
    title: "Crop Health Scan",
    description: "Upload a leaf image and check the result quickly.",
    route: "/crop-monitoring",
    action: "Open tool",
    span: "lg:col-span-7",
    surface:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(255,243,230,0.96)_100%)]",
  },
  {
    icon: Calendar,
    title: "Sowing Calendar",
    description: "Find timing by season and state without extra searching.",
    route: "/sowing-calendar",
    action: "Open tool",
    span: "lg:col-span-4",
    surface:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(255,249,227,0.96)_100%)]",
  },
  {
    icon: Megaphone,
    title: "Government Updates",
    description: "See important updates in a cleaner, easier list.",
    route: "/government-updates",
    action: "Open tool",
    span: "lg:col-span-4",
    surface:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(232,243,255,0.96)_100%)]",
  },
  {
    icon: MessageCircle,
    title: "Smart Chatbot",
    description: "Get help across the app without leaving the page.",
    action: "Always available",
    span: "lg:col-span-4",
    surface:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(232,255,247,0.96)_100%)]",
  },
  {
    icon: Mic,
    title: "Hindi + English Voice",
    description: "Speak, type, or listen with the same chatbot panel.",
    action: "Inside chatbot",
    span: "lg:col-span-12",
    surface:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(235,246,255,0.98)_50%,rgba(235,245,232,0.98)_100%)]",
  },
];

const Features = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="relative py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Everything in one place</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A fuller dashboard feel, with each tool easy to spot and open.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          {features.map((feature) => (
            <Card
              key={feature.title}
              onClick={() => {
                if (feature.route) {
                  navigate(feature.route);
                }
              }}
              className={`group relative overflow-hidden rounded-[30px] border border-white/80 p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feature.span} ${feature.route ? "cursor-pointer" : ""} ${feature.surface}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(61,122,55,0.12),transparent_35%)] opacity-70" />
              <div className="relative flex h-full min-h-[220px] flex-col justify-between p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-white/80 p-3 text-primary shadow-sm">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="rounded-full border border-primary/10 bg-white/70 px-3 py-1 text-xs font-medium text-primary">
                    {feature.action}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="max-w-xl text-base leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
