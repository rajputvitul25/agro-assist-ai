import { Card, CardContent } from "@/components/ui/card";
import { Upload, Brain, CheckCircle, Smartphone } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Smartphone,
      title: "Sign Up & Set Location",
      description: "Create your account and set your farm location for personalized recommendations",
      step: "01"
    },
    {
      icon: Upload,
      title: "Upload Crop Images",
      description: "Take photos of your crops, soil, or suspected pest issues using your mobile device",
      step: "02"
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Our machine learning models analyze your data and provide intelligent insights",
      step: "03"
    },
    {
      icon: CheckCircle,
      title: "Get Recommendations",
      description: "Receive actionable advice on crop selection, treatment, and farming practices",
      step: "04"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple steps to transform your farming with AI-powered insights
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full border-2 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <step.icon className="h-10 w-10 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30 transform -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;