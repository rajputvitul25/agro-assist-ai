import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  Sprout, 
  Calendar, 
  Camera, 
  Bug, 
  ArrowRight,
  Newspaper,
  Target,
  MapPin,
  ScanLine,
  Shield
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Megaphone,
      title: "Government Updates",
      description: "Stay informed with the latest agricultural policies, subsidies, and government schemes tailored for farmers.",
      color: "text-warning",
      bgColor: "bg-warning/10",
      details: ["Real-time policy updates", "Subsidy notifications", "Agricultural schemes"],
    },
    {
      icon: Target,
      title: "Crop Recommendations",
      description: "Get AI-powered suggestions for the best crops based on soil parameters, region, and seasonal conditions.",
      color: "text-success",
      bgColor: "bg-success/10",
      details: ["Soil-based analysis", "Regional suitability", "Seasonal recommendations"],
    },
    {
      icon: Calendar,
      title: "Sowing Calendar",
      description: "Receive precise sowing schedules and crop calendars customized for your location and current season.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      details: ["Location-based timing", "Weather integration", "Optimal planting windows"],
    },
    {
      icon: ScanLine,
      title: "Crop Monitoring",
      description: "Upload crop images for AI-powered health analysis and growth stage assessment.",
      color: "text-earth",
      bgColor: "bg-earth/10",
      details: ["Image-based analysis", "Health assessment", "Growth tracking"],
    },
    {
      icon: Bug,
      title: "Pest Identification",
      description: "Instantly identify pests and diseases with AI image recognition and get treatment solutions.",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      details: ["Instant pest detection", "Disease identification", "Treatment recommendations"],
    },
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-success rounded-lg flex items-center justify-center">
              <Sprout className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-success font-semibold">Comprehensive Solutions</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="block text-primary">Smart Farming</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered platform combines government updates, crop intelligence, 
            and pest management into one comprehensive farming assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/80">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-success rounded-full" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary-hover">
                    Learn More <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button size="lg" className="bg-gradient-to-r from-primary to-success hover:from-primary-hover hover:to-success/90">
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;