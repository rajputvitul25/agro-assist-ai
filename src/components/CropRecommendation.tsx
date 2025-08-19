import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer, Droplets, TestTube, MapPin, Calendar, Sprout } from "lucide-react";

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    humidity: "",
    temperature: "",
    region: "",
    season: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRecommendation = () => {
    // This would typically call an API for ML-based recommendations
    console.log("Getting recommendations for:", formData);
  };

  return (
    <section id="recommendations" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-success to-primary rounded-lg flex items-center justify-center">
              <Sprout className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-success font-semibold">AI-Powered Analysis</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Smart Crop
            <span className="block text-primary">Recommendations</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get personalized crop suggestions based on your soil parameters, location, and seasonal conditions using advanced machine learning.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-card border-border/50">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Soil Parameters */}
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                  <TestTube className="w-5 h-5 mr-2 text-primary" />
                  Soil Parameters
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ph" className="text-card-foreground">Soil pH Level</Label>
                <Input
                  id="ph"
                  type="number"
                  step="0.1"
                  placeholder="6.5"
                  value={formData.ph}
                  onChange={(e) => handleInputChange("ph", e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nitrogen" className="text-card-foreground">Nitrogen (N) mg/kg</Label>
                <Input
                  id="nitrogen"
                  type="number"
                  placeholder="40"
                  value={formData.nitrogen}
                  onChange={(e) => handleInputChange("nitrogen", e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phosphorus" className="text-card-foreground">Phosphorus (P) mg/kg</Label>
                <Input
                  id="phosphorus"
                  type="number"
                  placeholder="60"
                  value={formData.phosphorus}
                  onChange={(e) => handleInputChange("phosphorus", e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potassium" className="text-card-foreground">Potassium (K) mg/kg</Label>
                <Input
                  id="potassium"
                  type="number"
                  placeholder="20"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange("potassium", e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Environmental Conditions */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                  <Thermometer className="w-5 h-5 mr-2 text-warning" />
                  Environmental Conditions
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-card-foreground">Average Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="25"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange("temperature", e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="humidity" className="text-card-foreground">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  placeholder="80"
                  value={formData.humidity}
                  onChange={(e) => handleInputChange("humidity", e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-card-foreground">Region</Label>
                <Select onValueChange={(value) => handleInputChange("region", value)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">Northern India</SelectItem>
                    <SelectItem value="south">Southern India</SelectItem>
                    <SelectItem value="east">Eastern India</SelectItem>
                    <SelectItem value="west">Western India</SelectItem>
                    <SelectItem value="central">Central India</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="text-card-foreground">Season</Label>
                <Select onValueChange={(value) => handleInputChange("season", value)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                    <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                    <SelectItem value="zaid">Zaid (Summer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 mt-8">
                <Button 
                  type="button"
                  size="lg" 
                  onClick={handleRecommendation}
                  className="w-full bg-gradient-to-r from-primary to-success hover:from-primary-hover hover:to-success/90"
                >
                  Get AI Recommendations
                  <Sprout className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CropRecommendation;