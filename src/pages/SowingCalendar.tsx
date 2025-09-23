import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Cloud, Thermometer, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CropCalendar {
  crop: string;
  variety: string;
  sowingMonth: string;
  harvestMonth: string;
  duration: string;
  season: "Kharif" | "Rabi" | "Summer";
  region: string;
  temperatureRange: string;
  rainfallRequirement: string;
  soilType: string;
  tips: string[];
}

interface WeatherInfo {
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: string;
}

const SowingCalendar = () => {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState("Punjab");
  const [selectedSeason, setSelectedSeason] = useState("Kharif");
  const [cropCalendar, setCropCalendar] = useState<CropCalendar[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);

  const states = [
    "Punjab", "Haryana", "Uttar Pradesh", "Bihar", "West Bengal", 
    "Madhya Pradesh", "Rajasthan", "Gujarat", "Maharashtra", "Karnataka",
    "Andhra Pradesh", "Tamil Nadu", "Kerala", "Assam"
  ];

  const seasons = ["Kharif", "Rabi", "Summer"];

  // Mock crop calendar data
  const mockCalendarData: CropCalendar[] = [
    {
      crop: "Rice",
      variety: "Basmati",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "120-150 days",
      season: "Kharif",
      region: "Punjab",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1000-1200mm",
      soilType: "Clay loam",
      tips: [
        "Transplant 20-25 day old seedlings",
        "Maintain 2-3 cm water level",
        "Apply nitrogen in 3 splits"
      ]
    },
    {
      crop: "Wheat",
      variety: "HD-2967",
      sowingMonth: "November-December",
      harvestMonth: "April-May",
      duration: "120-140 days",
      season: "Rabi",
      region: "Punjab",
      temperatureRange: "15-25°C",
      rainfallRequirement: "400-600mm",
      soilType: "Sandy loam",
      tips: [
        "Sow after paddy harvest",
        "Use seed rate of 100kg/ha",
        "Apply pre-sowing irrigation"
      ]
    },
    {
      crop: "Cotton",
      variety: "Bt Cotton",
      sowingMonth: "April-May",
      harvestMonth: "October-December",
      duration: "180-200 days",
      season: "Kharif",
      region: "Punjab",
      temperatureRange: "25-35°C",
      rainfallRequirement: "600-800mm",
      soilType: "Black cotton soil",
      tips: [
        "Plant after soil temperature reaches 18°C",
        "Maintain 45cm row spacing",
        "Regular monitoring for pink bollworm"
      ]
    },
    {
      crop: "Maize",
      variety: "Hybrid",
      sowingMonth: "June-July",
      harvestMonth: "September-October",
      duration: "90-110 days",
      season: "Kharif",
      region: "Punjab",
      temperatureRange: "20-30°C",
      rainfallRequirement: "500-700mm",
      soilType: "Well-drained loam",
      tips: [
        "Plant 2-3 seeds per hill",
        "Apply balanced fertilizer",
        "Control fall armyworm"
      ]
    },
    {
      crop: "Mustard",
      variety: "Pusa Bold",
      sowingMonth: "October-November",
      harvestMonth: "February-March",
      duration: "120-140 days",
      season: "Rabi",
      region: "Punjab",
      temperatureRange: "10-25°C",
      rainfallRequirement: "300-400mm",
      soilType: "Sandy loam",
      tips: [
        "Sow on raised beds",
        "Use rhizobium culture",
        "Harvest at physiological maturity"
      ]
    },
    {
      crop: "Sugarcane",
      variety: "Co-238",
      sowingMonth: "February-March",
      harvestMonth: "December-February",
      duration: "10-12 months",
      season: "Summer",
      region: "Punjab",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1200-1500mm",
      soilType: "Deep fertile soil",
      tips: [
        "Plant 3-bud setts",
        "Maintain adequate moisture",
        "Apply organic manure"
      ]
    }
  ];

  // Mock weather data
  const mockWeatherData: WeatherInfo = {
    temperature: 28,
    humidity: 65,
    rainfall: 45,
    condition: "Partly cloudy"
  };

  useEffect(() => {
    // Filter calendar data based on selections
    const filtered = mockCalendarData.filter(
      item => item.region === selectedState && item.season === selectedSeason
    );
    setCropCalendar(filtered);
    setWeatherInfo(mockWeatherData);
  }, [selectedState, selectedSeason]);

  const getCurrentMonth = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  const isOptimalSowingTime = (sowingMonth: string) => {
    const currentMonth = getCurrentMonth();
    return sowingMonth.toLowerCase().includes(currentMonth.toLowerCase());
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case "Kharif": return "bg-green-100 text-green-800";
      case "Rabi": return "bg-blue-100 text-blue-800";
      case "Summer": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
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
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Sowing Calendar</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Region-Specific Sowing Calendar</h1>
            <p className="text-muted-foreground">
              Get personalized sowing schedules based on your location and current weather conditions
            </p>
          </div>

          {/* Filters and Weather */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Location & Season Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select State</label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger>
                        <SelectValue />
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
                    <label className="text-sm font-medium mb-2 block">Select Season</label>
                    <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                      <SelectTrigger>
                        <SelectValue />
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
              </CardContent>
            </Card>

            {weatherInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-primary" />
                    Current Weather
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <span className="font-medium">{weatherInfo.temperature}°C</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Humidity</span>
                    </div>
                    <span className="font-medium">{weatherInfo.humidity}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Rainfall</span>
                    </div>
                    <span className="font-medium">{weatherInfo.rainfall}mm</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{weatherInfo.condition}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Crop Calendar */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {selectedSeason} Crops for {selectedState}
              </h2>
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Current: {getCurrentMonth()}
              </Badge>
            </div>

            {cropCalendar.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">
                    No crops available for the selected region and season
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {cropCalendar.map((crop, index) => (
                  <Card key={index} className={`hover:shadow-lg transition-shadow ${
                    isOptimalSowingTime(crop.sowingMonth) ? 'ring-2 ring-primary/20' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{crop.crop}</CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getSeasonColor(crop.season)}>
                            {crop.season}
                          </Badge>
                          {isOptimalSowingTime(crop.sowingMonth) && (
                            <Badge className="bg-green-100 text-green-800">
                              Optimal Time
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Variety: {crop.variety}</p>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Sowing:</span>
                          <p className="text-muted-foreground">{crop.sowingMonth}</p>
                        </div>
                        <div>
                          <span className="font-medium">Harvest:</span>
                          <p className="text-muted-foreground">{crop.harvestMonth}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p className="text-muted-foreground">{crop.duration}</p>
                        </div>
                        <div>
                          <span className="font-medium">Temperature:</span>
                          <p className="text-muted-foreground">{crop.temperatureRange}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Rainfall:</span>
                          <span className="text-muted-foreground">{crop.rainfallRequirement}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Soil Type:</span>
                          <span className="text-muted-foreground">{crop.soilType}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Growing Tips:</h4>
                        <ul className="space-y-1">
                          {crop.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button variant="outline" className="w-full">
                        Get Detailed Guide
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SowingCalendar;