import { Sprout, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sprout className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Smart Farmer's Assistant</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a>
          <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
          <Button variant="default">Get Started</Button>
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default Header;