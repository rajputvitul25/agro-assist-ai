import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sprout, ArrowLeft, Brain, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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

const getGrowingSteps = (crop: string): string[] => {
  switch (crop.toLowerCase()) {
    case "rice":
      return [
        "Prepare leveled, well-drained fields; puddle if transplanting.",
        "Use certified seedlings or high-yielding varieties.",
        "Apply basal fertilizer: balanced NPK according to soil test.",
        "Maintain water level during vegetative growth; manage drainage before harvest.",
        "Monitor pests (stem borer, leaf blast) and diseases; apply IPM measures.",
        "Harvest at physiological maturity and dry grains properly."
      ];
    case "wheat":
      return [
        "Choose well-drained loamy soils; prepare seedbed finely.",
        "Sow at recommended seed rate for your region and season.",
        "Apply nitrogen in split doses; follow soil test for P and K.",
        "Irrigate at critical stages (tillering, flowering, grain filling).",
        "Control weeds early; scout for aphids and rusts.",
        "Harvest when grains are hard and moisture is low; store in cool, dry place."
      ];
    case "maize":
      return [
        "Plant in well-drained soils with good fertility.",
        "Use optimal spacing and hybrid seeds for higher yields.",
        "Apply fertilizer rich in nitrogen; side-dress during growth.",
        "Ensure timely weeding and control stem borers and fall armyworm.",
        "Harvest when cobs are mature; dry and shell appropriately."
      ];
    case "cotton":
      return [
        "Prefer deep, well-drained soils; prepare seedbed properly.",
        "Use Bt or recommended varieties and proper planting density.",
        "Apply balanced NPK; potassium is important for fiber quality.",
        "Manage pests (bollworm) with IPM and pheromone traps.",
        "Harvest in multiple picks or use mechanical harvesters where available."
      ];
    case "tomato":
      return [
        "Use raised beds or protected cultivation for better control.",
        "Use staking or trellising for indeterminate varieties.",
        "Maintain regular irrigation and fertigation for steady growth.",
        "Protect from late blight and bacterial diseases; practice crop rotation.",
        "Harvest when fruits reach desired firmness and color."
      ];
    default:
      return [
        "Follow local agronomic recommendations and enriched seedlings.",
        "Perform soil test and apply fertilizers as per recommendations.",
        "Ensure proper irrigation scheduling and pest monitoring.",
        "Harvest at recommended maturity and practice proper post-harvest handling."
      ];
  }
};

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
  const [predictions, setPredictions] = useState<CropPrediction[] | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<CropPrediction | null>(null);
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
    
    // Rule-based scoring across many crops (simple heuristic model)
    const cropDatabase: Array<{
      crop: string;
      phRange: [number, number];
      tempRange: [number, number];
      humidityRange: [number, number];
      rainfallRange: [number, number];
      nitrogenPreference?: [number, number];
      potassiumPreference?: [number, number];
      phosphorusPreference?: [number, number];
      seasons: string[];
      description: string;
      benefits: string[];
    }> = [
      { crop: "Rice", phRange: [5.0, 7.5], tempRange: [20, 35], humidityRange: [60, 100], rainfallRange: [800, 3000], nitrogenPreference: [80,200], potassiumPreference: [100,300], phosphorusPreference: [20,100], seasons: ["Kharif"], description: "Thrives in warm temperatures with high humidity and abundant water.", benefits: ["High yield potential","Staple food crop","Strong market demand"] },
      { crop: "Wheat", phRange: [6.0,7.5], tempRange: [10,25], humidityRange: [40,70], rainfallRange: [300,900], nitrogenPreference: [80,200], potassiumPreference: [80,200], phosphorusPreference: [30,90], seasons: ["Rabi"], description: "Performs well in cooler seasons with moderate moisture.", benefits: ["Good storage life","Reliable yield","High protein content"] },
      { crop: "Maize", phRange: [5.5,7.5], tempRange: [18,30], humidityRange: [50,80], rainfallRange: [500,1200], nitrogenPreference: [100,250], potassiumPreference: [80,200], phosphorusPreference: [30,120], seasons: ["Kharif","Summer"], description: "Versatile cereal crop suited to a variety of soils and climates.", benefits: ["High demand","Fast growing","Good animal feed"] },
      { crop: "Cotton", phRange: [5.5,7.5], tempRange: [20,35], humidityRange: [40,70], rainfallRange: [400,1200], nitrogenPreference: [60,180], potassiumPreference: [120,300], phosphorusPreference: [20,80], seasons: ["Kharif"], description: "Fiber crop that prefers warm temperatures and well-drained soils.", benefits: ["High economic returns","Industrial demand","Cash crop"] },
      { crop: "Sugarcane", phRange: [6.0,8.0], tempRange: [20,35], humidityRange: [60,90], rainfallRange: [1000,2000], nitrogenPreference: [120,300], potassiumPreference: [150,350], phosphorusPreference: [30,100], seasons: ["Kharif","Rabi"], description: "Perennial crop needing high moisture and nutrients.", benefits: ["High sugar yields","Industrial crop","Byproducts for livestock"] },
      { crop: "Soybean", phRange: [5.5,7.0], tempRange: [20,30], humidityRange: [50,80], rainfallRange: [500,1000], nitrogenPreference: [20,80], potassiumPreference: [40,150], phosphorusPreference: [20,80], seasons: ["Kharif"], description: "Legume crop that improves soil nitrogen; suitable for moderate climates.", benefits: ["Protein-rich","Soil improving","Good market demand"] },
      { crop: "Groundnut", phRange: [5.5,7.0], tempRange: [20,35], humidityRange: [50,80], rainfallRange: [500,1000], nitrogenPreference: [20,80], potassiumPreference: [60,180], phosphorusPreference: [20,80], seasons: ["Kharif"], description: "Oilseed crop suited to light soils and warm climates.", benefits: ["Oilseed market","Nitrogen-fixing","Short duration"] },
      { crop: "Potato", phRange: [5.0,6.5], tempRange: [10,25], humidityRange: [60,90], rainfallRange: [300,900], nitrogenPreference: [100,250], potassiumPreference: [120,300], phosphorusPreference: [40,120], seasons: ["Rabi","Summer"], description: "Tuber crop that prefers cooler temperatures and well-drained soils.", benefits: ["High calorie yield","Strong market","Multiple varieties"] },
      { crop: "Tomato", phRange: [5.5,7.0], tempRange: [18,30], humidityRange: [50,80], rainfallRange: [400,1200], nitrogenPreference: [80,200], potassiumPreference: [80,200], phosphorusPreference: [40,120], seasons: ["Summer"], description: "High-value vegetable crop suitable for irrigated fields or protected cultivation.", benefits: ["High market value","Short duration","Good returns"] }
    ];

    const rangeScore = (val: number, range: [number, number]) => {
      const [low, high] = range;
      if (isNaN(val)) return 0;
      if (val >= low && val <= high) return 1;
      const span = Math.max(1, high - low);
      const distance = val < low ? low - val : val - high;
      const score = Math.max(0, 1 - distance / (span * 1.5));
      return score;
    };

    const pH = parseFloat(soilData.pH || "NaN");
    const temp = parseFloat(soilData.temperature || "NaN");
    const humidity = parseFloat(soilData.humidity || "NaN");
    const rainfall = parseFloat(soilData.rainfall || "NaN");
    const nitrogen = parseFloat(soilData.nitrogen || "NaN");
    const phosphorus = parseFloat(soilData.phosphorus || "NaN");
    const potassium = parseFloat(soilData.potassium || "NaN");

    const scored = cropDatabase.map((c) => {
      let score = 0;
      const weights = { ph: 1.2, temp: 1.0, humidity: 0.9, rainfall: 0.9, nitrogen: 0.6, phosphorus: 0.5, potassium: 0.6, season: 1.0 } as const;
      score += weights.ph * rangeScore(pH, c.phRange);
      score += weights.temp * rangeScore(temp, c.tempRange);
      score += weights.humidity * rangeScore(humidity, c.humidityRange);
      score += weights.rainfall * rangeScore(rainfall, c.rainfallRange);
      if (c.nitrogenPreference) score += weights.nitrogen * rangeScore(nitrogen, c.nitrogenPreference);
      if (c.phosphorusPreference) score += weights.phosphorus * rangeScore(phosphorus, c.phosphorusPreference);
      if (c.potassiumPreference) score += weights.potassium * rangeScore(potassium, c.potassiumPreference);
      if (soilData.season && c.seasons.includes(soilData.season)) score += weights.season * 1.0;
      const maxWeight = Object.values(weights).reduce((s, v) => s + v, 0);
      const normalized = Math.max(0, Math.min(1, score / maxWeight));
      const confidence = Math.round(50 + normalized * 49);
      return { crop: c.crop, confidence, description: c.description, benefits: c.benefits, score: normalized } as CropPrediction & { score: number };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3).map(({ crop, confidence, description, benefits }) => ({ crop, confidence, description, benefits }));

    setPredictions(top);
    setIsLoading(false);

    toast({ title: "Analysis Complete", description: `Top recommendation: ${top[0].crop} (${top[0].confidence}% confidence)` });
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
                {!predictions ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Enter your soil parameters to get AI-powered crop recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {predictions.map((p, i) => (
                        <div key={p.crop} className="p-3 bg-muted rounded">
                          <div className="text-center font-semibold text-primary">{p.crop}</div>
                          <div className="text-sm text-muted-foreground">Confidence: {p.confidence}%</div>
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: `${p.confidence}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show details for top recommendation */}
                    <div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-2">{predictions[0].crop}</div>
                        <div className="text-lg text-muted-foreground">Confidence: {predictions[0].confidence}%</div>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: `${predictions[0].confidence}%` }} />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-muted-foreground">{predictions[0].description}</p>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Benefits</h4>
                        <ul className="space-y-1">
                          {predictions[0].benefits.map((benefit, index) => (
                            <li key={index} className="text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          setSelectedGuide(predictions[0]);
                          setGuideOpen(true);
                        }}
                      >
                        Get Detailed Growing Guide
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              {/* Detailed Growing Guide Dialog */}
              <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedGuide ? `${selectedGuide.crop} - Growing Guide` : "Growing Guide"}</DialogTitle>
                    <DialogDescription>
                      Detailed cultivation steps and recommendations for the selected crop.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-2">
                    {selectedGuide ? (
                      <>
                        <p className="text-muted-foreground">{selectedGuide.description}</p>
                        <div>
                          <h4 className="font-semibold">Benefits</h4>
                          <ul className="list-disc ml-5 text-muted-foreground">
                            {selectedGuide.benefits.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold">Growing Steps</h4>
                          <ol className="list-decimal ml-5 text-muted-foreground space-y-1">
                            {getGrowingSteps(selectedGuide.crop).map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Select a crop to view its detailed guide.</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setGuideOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;