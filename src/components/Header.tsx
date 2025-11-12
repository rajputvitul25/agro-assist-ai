import { Sprout, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 animate-scale-in">
          <Sprout className="h-8 w-8 text-primary animate-pulse-slow" />
          <span className="text-xl font-bold text-foreground">Smart Farmer's Assistant</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6 animate-slide-up">
          <button 
            onClick={() => navigate("/crop-recommendation")}
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
          >
            Crop Recommendation
          </button>
          <button 
            onClick={() => navigate("/crop-monitoring")}
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
          >
            Crop Monitoring
          </button>
          <button 
            onClick={() => navigate("/government-updates")}
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
          >
            Gov Updates
          </button>
          <button 
            onClick={() => navigate("/sowing-calendar")}
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
          >
            Sowing Calendar
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden md:inline-flex"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button 
                variant="default" 
                className="hover:scale-105 transition-transform duration-300"
                onClick={() => navigate("/login")}
              >
                Get Started
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;