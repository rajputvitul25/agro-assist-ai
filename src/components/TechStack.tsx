import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TechStack = () => {
  const technologies = [
    {
      category: "Frontend",
      items: ["React", "TypeScript", "Tailwind CSS", "Vite"],
      description: "Modern, responsive user interface built for all devices"
    },
    {
      category: "AI & Machine Learning",
      items: ["TensorFlow", "PyTorch", "MobileNetV2", "ResNet50"],
      description: "Advanced deep learning models for crop and disease detection"
    },
    {
      category: "Backend",
      items: ["Node.js", "Python", "REST APIs", "Real-time Data"],
      description: "Scalable backend infrastructure for data processing"
    },
    {
      category: "Data Sources",
      items: ["IMD Weather", "Data.gov.in", "OpenWeatherMap", "PlantVillage"],
      description: "Reliable data sources for accurate recommendations"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built With Modern Technology
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform leverages cutting-edge technologies to deliver reliable, 
            accurate, and scalable agricultural solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {technologies.map((tech, index) => (
            <Card key={index} className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{tech.category}</CardTitle>
                <p className="text-muted-foreground">{tech.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tech.items.map((item, itemIndex) => (
                    <Badge key={itemIndex} variant="secondary" className="text-sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack;