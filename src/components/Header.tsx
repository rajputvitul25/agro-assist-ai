import { Sprout, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 animate-scale-in">
          <Sprout className="h-8 w-8 text-primary animate-pulse-slow" />
          <span className="text-xl font-bold text-foreground">Smart Farmer's Assistant</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6 animate-slide-up">
          <a href="#features" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">How It Works</a>
          <a href="#about" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">About</a>
          <Button variant="default" className="hover:scale-105 transition-transform duration-300">Get Started</Button>
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default Header;