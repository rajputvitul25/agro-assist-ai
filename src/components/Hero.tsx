import { Button } from "@/components/ui/button";
import { ArrowRight, Sprout, Eye, Shield } from "lucide-react";
import heroImage from "@/assets/hero-farm.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Agricultural landscape with crops and farmland" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-success font-semibold">AI-Powered Agriculture</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Smart Farmer's
            <span className="block text-primary">Assistant</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Revolutionize your farming with AI-driven crop recommendations, 
            real-time monitoring, and intelligent pest management solutions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-success hover:from-primary-hover hover:to-success/90">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 bg-card/50 backdrop-blur p-4 rounded-lg border border-border/50">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">AI-powered crop suggestions</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-card/50 backdrop-blur p-4 rounded-lg border border-border/50">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Crop Monitoring</h3>
                <p className="text-sm text-muted-foreground">Real-time health analysis</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-card/50 backdrop-blur p-4 rounded-lg border border-border/50">
              <div className="w-10 h-10 bg-earth/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-earth" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Pest Protection</h3>
                <p className="text-sm text-muted-foreground">Intelligent pest identification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;