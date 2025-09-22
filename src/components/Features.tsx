import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Megaphone, 
  Target, 
  Calendar, 
  Camera, 
  Bug, 
  TrendingUp,
  MapPin,
  CloudRain
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Megaphone,
      title: "Government Updates",
      description: "Real-time updates on government schemes, subsidies, and agricultural policies from official data sources.",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      icon: Target,
      title: "Crop Recommendation",
      description: "AI-powered suggestions for optimal crops based on soil parameters, climate, and regional conditions.",
      color: "bg-green-500/10 text-green-600"
    },
    {
      icon: Calendar,
      title: "Sowing Calendar",
      description: "Location-specific sowing schedules and crop calendars based on weather patterns and seasonal data.",
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      icon: Camera,
      title: "Crop Health Monitoring",
      description: "Upload crop images for AI-powered health assessment and growth stage analysis.",
      color: "bg-orange-500/10 text-orange-600"
    },
    {
      icon: Bug,
      title: "Pest & Disease Detection",
      description: "Instant identification of crop diseases and pests with treatment recommendations.",
      color: "bg-red-500/10 text-red-600"
    },
    {
      icon: TrendingUp,
      title: "Decision Support System",
      description: "Comprehensive insights combining all data sources for actionable farming decisions.",
      color: "bg-indigo-500/10 text-indigo-600"
    },
    {
      icon: MapPin,
      title: "Location-Based Advice",
      description: "Hyper-local recommendations tailored to your specific geographic region and conditions.",
      color: "bg-teal-500/10 text-teal-600"
    },
    {
      icon: CloudRain,
      title: "Weather Integration",
      description: "Real-time weather data from IMD and OpenWeatherMap for precise farming guidance.",
      color: "bg-cyan-500/10 text-cyan-600"
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comprehensive Agricultural Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform integrates cutting-edge AI technology with agricultural expertise to provide 
            farmers with everything they need for successful crop management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feature.color}`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;