import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Smartphone, Cloud, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Agricultural landscape with modern farming technology" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              AI-Driven <span className="text-primary">Crop Management</span> & Advisory Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Empowering farmers with real-time government updates, AI-powered crop recommendations, 
              disease detection, and weather-based sowing advice. Your complete agricultural advisory platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in" style={{animationDelay: '0.4s'}}>
              <Button 
                size="lg" 
                className="text-lg px-8 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => navigate("/crop-recommendation")}
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => navigate("/crop-monitoring")}
              >
                Try AI Analysis
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-slide-up" style={{animationDelay: '0.6s'}}>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile-First Design</h3>
              <p className="text-muted-foreground">Accessible on any device, designed for farmers in remote areas</p>
            </Card>

            <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-slide-up" style={{animationDelay: '0.8s'}}>
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{animationDelay: '0.5s'}}>
                <Cloud className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
              <p className="text-muted-foreground">Live weather updates, government schemes, and market prices</p>
            </Card>

            <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-slide-up" style={{animationDelay: '1s'}}>
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{animationDelay: '1s'}}>
                <Leaf className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground">Machine learning models for crop and disease detection</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;