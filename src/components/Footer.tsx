import { Sprout, Mail, MapPin, GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sprout className="h-8 w-8" />
              <span className="text-xl font-bold">Smart Farmer's Assistant</span>
            </div>
            <p className="text-background/80">
              AI-driven agricultural platform empowering farmers with intelligent 
              crop management and advisory services.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Features</h4>
            <ul className="space-y-2 text-background/80">
              <li>Crop Recommendations</li>
              <li>Disease Detection</li>
              <li>Government Updates</li>
              <li>Weather Advisory</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Academic Project</h4>
            <div className="space-y-2 text-background/80">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>IMS Engineering College</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Ghaziabad, India</span>
              </div>
              <p>Computer Science Department</p>
              <p>Final Year Project 2025-2026</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Project Team</h4>
            <div className="space-y-2 text-background/80">
              <p><strong>Students:</strong></p>
              <ul className="space-y-1">
                <li>Vitul Rajput</li>
                <li>Isha Rajput</li>
                <li>Kanishka Gaur</li>
              </ul>
              <p className="mt-3"><strong>Guide:</strong></p>
              <p>Dr. Sonia Juneja</p>
              <p>Head of Department</p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/60">
          <p>&copy; 2025 Smart Farmer's Assistant. Academic Project - IMS Engineering College, Ghaziabad.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;