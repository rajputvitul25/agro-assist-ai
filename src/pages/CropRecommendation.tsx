import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sprout, ArrowLeft, Brain, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SoilData {
  pH: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  temperature: string;
  humidity: string;
  rainfall: string;
  state: string;
  season: string;
}

interface CropPrediction {
  crop: string;
  confidence: number;
  description: string;
  benefits: string[];
}

const CropRecommendation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [soilData, setSoilData] = useState<SoilData>({
    pH: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    temperature: "",
    humidity: "",
    rainfall: "",
    state: "",
    season: ""
  });
  const [prediction, setPrediction] = useState<CropPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const states = [
    "Andhra Pradesh", "Assam", "Bihar", "Gujarat", "Haryana", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", 
    "Tamil Nadu", "Uttar Pradesh", "West Bengal"
  ];

  const seasons = ["Kharif", "Rabi", "Summer"];

  const handleInputChange = (field: keyof SoilData, value: string) => {
    setSoilData(prev => ({ ...prev, [field]: value }));
  };

  const generatePrediction = async () => {
    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock prediction logic based on input parameters
    const mockPredictions: CropPrediction[] = [
      {
        crop: "Rice",
        confidence: 92,
        description: "Excellent choice for your soil conditions and climate. Rice thrives in high humidity and adequate rainfall.",
        benefits: ["High yield potential", "Good market demand", "Suitable for your climate", "Water-efficient variety available"]
      },
      {
        crop: "Wheat",
        confidence: 88,
        description: "Great option for rabi season with good nitrogen content. Wheat performs well in cooler temperatures.",
        benefits: ["Stable market price", "Low water requirement", "Good storage life", "High protein content"]
      },
      {
        crop: "Cotton",
        confidence: 85,
        description: "Cotton cultivation recommended based on your soil pH and potassium levels.",
        benefits: ["High economic returns", "Drought resistant", "Long harvesting period", "Multiple uses"]
      }
    ];

    // Simple logic to select prediction based on season and soil conditions
    let selectedPrediction = mockPredictions[0];
    
    if (soilData.season === "Rabi" && parseFloat(soilData.temperature) < 25) {
      selectedPrediction = mockPredictions[1];
    } else if (parseFloat(soilData.pH) > 7 && parseFloat(soilData.potassium) > 200) {
      selectedPrediction = mockPredictions[2];
    }

    setPrediction(selectedPrediction);
    setIsLoading(false);
    
    toast({
      title: "Analysis Complete",
      description: `Recommended crop: ${selectedPrediction.crop} with ${selectedPrediction.confidence}% confidence`,
    });
  };

  const isFormValid = () => {
    return Object.values(soilData).every(value => value.trim() !== "");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Sprout className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Crop Recommendation</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">AI-Powered Crop Recommendation</h1>
            <p className="text-muted-foreground">
              Enter your soil parameters and location details to get personalized crop recommendations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Soil & Climate Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ph">Soil pH</Label>
                    <Input
                      id="ph"
                      type="number"
                      step="0.1"
                      placeholder="6.5"
                      value={soilData.pH}
                      onChange={(e) => handleInputChange("pH", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nitrogen">Nitrogen (kg/ha)</Label>
                    <Input
                      id="nitrogen"
                      type="number"
                      placeholder="100"
                      value={soilData.nitrogen}
                      onChange={(e) => handleInputChange("nitrogen", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phosphorus">Phosphorus (kg/ha)</Label>
                    <Input
                      id="phosphorus"
                      type="number"
                      placeholder="50"
                      value={soilData.phosphorus}
                      onChange={(e) => handleInputChange("phosphorus", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="potassium">Potassium (kg/ha)</Label>
                    <Input
                      id="potassium"
                      type="number"
                      placeholder="200"
                      value={soilData.potassium}
                      onChange={(e) => handleInputChange("potassium", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      placeholder="28"
                      value={soilData.temperature}
                      onChange={(e) => handleInputChange("temperature", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="humidity">Humidity (%)</Label>
                    <Input
                      id="humidity"
                      type="number"
                      placeholder="65"
                      value={soilData.humidity}
                      onChange={(e) => handleInputChange("humidity", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rainfall">Annual Rainfall (mm)</Label>
                  <Input
                    id="rainfall"
                    type="number"
                    placeholder="1200"
                    value={soilData.rainfall}
                    onChange={(e) => handleInputChange("rainfall", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>State</Label>
                    <Select value={soilData.state} onValueChange={(value) => handleInputChange("state", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Season</Label>
                    <Select value={soilData.season} onValueChange={(value) => handleInputChange("season", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season} value={season}>
                            {season}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={generatePrediction}
                  disabled={!isFormValid() || isLoading}
                >
                  {isLoading ? "Analyzing..." : "Get Crop Recommendation"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recommendation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!prediction ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Enter your soil parameters to get AI-powered crop recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-2">{prediction.crop}</div>
                      <div className="text-lg text-muted-foreground">
                        Confidence: {prediction.confidence}%
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${prediction.confidence}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-muted-foreground">{prediction.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Benefits</h4>
                      <ul className="space-y-1">
                        {prediction.benefits.map((benefit, index) => (
                          <li key={index} className="text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button variant="outline" className="w-full">
                      Get Detailed Growing Guide
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;