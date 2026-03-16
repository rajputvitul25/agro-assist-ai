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
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedSeason, setSelectedSeason] = useState("All Seasons");
  const [cropCalendar, setCropCalendar] = useState<CropCalendar[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);

  const states = [
    "All States",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
  ];

  const seasons = ["All Seasons", "Kharif", "Rabi", "Summer"];

  // Comprehensive crop calendar data for all states
  const mockCalendarData: CropCalendar[] = [
    // Punjab Crops
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
      sowingMonth: "February-March",
      harvestMonth: "May-June",
      duration: "90-110 days",
      season: "Summer",
      region: "Punjab",
      temperatureRange: "20-30°C",
      rainfallRequirement: "500-700mm",
      soilType: "Well-drained loam",
      tips: [
        "Plant 2-3 seeds per hill",
        "Apply balanced fertilizer",
        "Ensure adequate irrigation"
      ]
    },

    // Uttar Pradesh Crops
    {
      crop: "Sugarcane",
      variety: "Co-238",
      sowingMonth: "February-March",
      harvestMonth: "December-February",
      duration: "10-12 months",
      season: "Summer",
      region: "Uttar Pradesh",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1200-1500mm",
      soilType: "Deep fertile soil",
      tips: [
        "Plant 3-bud setts",
        "Maintain adequate moisture",
        "Apply organic manure"
      ]
    },
    {
      crop: "Wheat",
      variety: "PBW-343",
      sowingMonth: "November-December",
      harvestMonth: "April-May",
      duration: "120-140 days",
      season: "Rabi",
      region: "Uttar Pradesh",
      temperatureRange: "15-25°C",
      rainfallRequirement: "400-600mm",
      soilType: "Sandy loam",
      tips: [
        "Timely sowing is crucial",
        "Use certified seeds",
        "Apply balanced fertilization"
      ]
    },
    {
      crop: "Rice",
      variety: "Saryu-52",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "120-135 days",
      season: "Kharif",
      region: "Uttar Pradesh",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1000-1200mm",
      soilType: "Clay loam",
      tips: [
        "Transplant healthy seedlings",
        "Maintain water level",
        "Regular weeding required"
      ]
    },
    {
      crop: "Fodder Maize",
      variety: "African Tall",
      sowingMonth: "March-April",
      harvestMonth: "June-July",
      duration: "70-90 days",
      season: "Summer",
      region: "Uttar Pradesh",
      temperatureRange: "25-35°C",
      rainfallRequirement: "400-500mm",
      soilType: "Well-drained loam",
      tips: [
        "Quick growing variety",
        "High yield fodder crop",
        "Regular irrigation needed"
      ]
    },

    // Bihar Crops
    {
      crop: "Rice",
      variety: "Swarna",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "135-140 days",
      season: "Kharif",
      region: "Bihar",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1000-1200mm",
      soilType: "Clay",
      tips: [
        "Flood resistant variety",
        "Suitable for lowland areas",
        "Good for Bihar conditions"
      ]
    },
    {
      crop: "Wheat",
      variety: "HD-2733",
      sowingMonth: "November-December",
      harvestMonth: "April-May",
      duration: "120-125 days",
      season: "Rabi",
      region: "Bihar",
      temperatureRange: "15-25°C",
      rainfallRequirement: "400-500mm",
      soilType: "Sandy loam",
      tips: [
        "Heat tolerant variety",
        "Good grain quality",
        "Disease resistant"
      ]
    },
    {
      crop: "Maize",
      variety: "Prakash",
      sowingMonth: "March-April",
      harvestMonth: "June-July",
      duration: "90-100 days",
      season: "Summer",
      region: "Bihar",
      temperatureRange: "25-35°C",
      rainfallRequirement: "400-600mm",
      soilType: "Well-drained",
      tips: [
        "Summer hybrid variety",
        "Good for Bihar climate",
        "Regular irrigation required"
      ]
    },

    // Maharashtra Crops
    {
      crop: "Cotton",
      variety: "Bt Cotton",
      sowingMonth: "June-July",
      harvestMonth: "December-January",
      duration: "180-200 days",
      season: "Kharif",
      region: "Maharashtra",
      temperatureRange: "25-35°C",
      rainfallRequirement: "600-800mm",
      soilType: "Black cotton soil",
      tips: [
        "Major cash crop of Maharashtra",
        "Bollworm resistant variety",
        "Spacing: 90cm x 60cm"
      ]
    },
    {
      crop: "Sugarcane",
      variety: "Co-86032",
      sowingMonth: "February-March",
      harvestMonth: "December-February",
      duration: "10-12 months",
      season: "Summer",
      region: "Maharashtra",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1200-1500mm",
      soilType: "Deep black soil",
      tips: [
        "High sugar content variety",
        "Drought tolerant",
        "Ratoon crop possible"
      ]
    },
    {
      crop: "Jowar",
      variety: "CSH-16",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "110-120 days",
      season: "Kharif",
      region: "Maharashtra",
      temperatureRange: "25-35°C",
      rainfallRequirement: "400-600mm",
      soilType: "Black soil",
      tips: [
        "Drought resistant crop",
        "Good for rainfed areas",
        "Nutritious grain crop"
      ]
    },
    {
      crop: "Wheat",
      variety: "NIAW-301",
      sowingMonth: "November-December",
      harvestMonth: "March-April",
      duration: "110-120 days",
      season: "Rabi",
      region: "Maharashtra",
      temperatureRange: "15-25°C",
      rainfallRequirement: "300-400mm",
      soilType: "Black soil",
      tips: [
        "Durum wheat variety",
        "Good for Maharashtra",
        "Heat tolerant"
      ]
    },

    // Gujarat Crops
    {
      crop: "Cotton",
      variety: "Shankar-6",
      sowingMonth: "June-July",
      harvestMonth: "December-January",
      duration: "180-200 days",
      season: "Kharif",
      region: "Gujarat",
      temperatureRange: "25-35°C",
      rainfallRequirement: "600-800mm",
      soilType: "Black cotton soil",
      tips: [
        "High yielding variety",
        "Good fiber quality",
        "Pest management crucial"
      ]
    },
    {
      crop: "Groundnut",
      variety: "GG-20",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "110-120 days",
      season: "Kharif",
      region: "Gujarat",
      temperatureRange: "25-30°C",
      rainfallRequirement: "500-700mm",
      soilType: "Sandy loam",
      tips: [
        "Major oilseed crop",
        "Calcium requirement high",
        "Harvest at proper maturity"
      ]
    },
    {
      crop: "Wheat",
      variety: "GW-496",
      sowingMonth: "November-December",
      harvestMonth: "March-April",
      duration: "110-115 days",
      season: "Rabi",
      region: "Gujarat",
      temperatureRange: "15-25°C",
      rainfallRequirement: "300-400mm",
      soilType: "Sandy loam",
      tips: [
        "High yielding variety",
        "Good grain quality",
        "Suitable for Gujarat"
      ]
    },
    {
      crop: "Castor",
      variety: "GCH-7",
      sowingMonth: "March-April",
      harvestMonth: "August-September",
      duration: "150-180 days",
      season: "Summer",
      region: "Gujarat",
      temperatureRange: "25-35°C",
      rainfallRequirement: "400-600mm",
      soilType: "Well-drained",
      tips: [
        "Commercial oil crop",
        "Drought tolerant",
        "Multiple harvests possible"
      ]
    },

    // Rajasthan Crops
    {
      crop: "Bajra",
      variety: "HHB-67",
      sowingMonth: "June-July",
      harvestMonth: "September-October",
      duration: "75-90 days",
      season: "Kharif",
      region: "Rajasthan",
      temperatureRange: "25-35°C",
      rainfallRequirement: "300-500mm",
      soilType: "Sandy soil",
      tips: [
        "Drought resistant crop",
        "Good for arid regions",
        "Nutritious millet crop"
      ]
    },
    {
      crop: "Mustard",
      variety: "RH-30",
      sowingMonth: "October-November",
      harvestMonth: "February-March",
      duration: "120-140 days",
      season: "Rabi",
      region: "Rajasthan",
      temperatureRange: "10-25°C",
      rainfallRequirement: "300-400mm",
      soilType: "Sandy loam",
      tips: [
        "Major oilseed of Rajasthan",
        "Cold tolerant variety",
        "Good oil content"
      ]
    },
    {
      crop: "Guar",
      variety: "RGC-1038",
      sowingMonth: "July-August",
      harvestMonth: "October-November",
      duration: "90-120 days",
      season: "Kharif",
      region: "Rajasthan",
      temperatureRange: "25-35°C",
      rainfallRequirement: "300-500mm",
      soilType: "Sandy soil",
      tips: [
        "Industrial crop",
        "Drought tolerant",
        "Good market demand"
      ]
    },
    {
      crop: "Cumin",
      variety: "GC-4",
      sowingMonth: "November-December",
      harvestMonth: "March-April",
      duration: "110-130 days",
      season: "Rabi",
      region: "Rajasthan",
      temperatureRange: "15-25°C",
      rainfallRequirement: "200-300mm",
      soilType: "Sandy loam",
      tips: [
        "Spice crop",
        "High value crop",
        "Requires cool weather"
      ]
    },

    // Tamil Nadu Crops
    {
      crop: "Rice",
      variety: "ADT-43",
      sowingMonth: "June-July",
      harvestMonth: "September-October",
      duration: "110-115 days",
      season: "Kharif",
      region: "Tamil Nadu",
      temperatureRange: "25-35°C",
      rainfallRequirement: "1000-1200mm",
      soilType: "Clay",
      tips: [
        "Short duration variety",
        "Good for Tamil Nadu",
        "High yielding"
      ]
    },
    {
      crop: "Sugarcane",
      variety: "Co-86032",
      sowingMonth: "January-February",
      harvestMonth: "December-January",
      duration: "10-12 months",
      season: "Summer",
      region: "Tamil Nadu",
      temperatureRange: "20-35°C",
      rainfallRequirement: "1200-1500mm",
      soilType: "Red soil",
      tips: [
        "High sugar content",
        "Suitable for Tamil Nadu",
        "Good ratoon potential"
      ]
    },
    {
      crop: "Cotton",
      variety: "MCU-5",
      sowingMonth: "June-July",
      harvestMonth: "December-January",
      duration: "180-200 days",
      season: "Kharif",
      region: "Tamil Nadu",
      temperatureRange: "25-35°C",
      rainfallRequirement: "600-800mm",
      soilType: "Black soil",
      tips: [
        "Medium staple cotton",
        "Good for Tamil Nadu",
        "Disease resistant"
      ]
    },

    // Karnataka Crops
    {
      crop: "Ragi",
      variety: "MR-1",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "120-135 days",
      season: "Kharif",
      region: "Karnataka",
      temperatureRange: "20-30°C",
      rainfallRequirement: "500-750mm",
      soilType: "Red soil",
      tips: [
        "Nutritious millet crop",
        "Drought tolerant",
        "Good for rainfed areas"
      ]
    },
    {
      crop: "Sunflower",
      variety: "KBSH-1",
      sowingMonth: "February-March",
      harvestMonth: "May-June",
      duration: "90-110 days",
      season: "Summer",
      region: "Karnataka",
      temperatureRange: "25-30°C",
      rainfallRequirement: "400-600mm",
      soilType: "Well-drained",
      tips: [
        "Oilseed crop",
        "Short duration",
        "Good oil content"
      ]
    },
    {
      crop: "Jowar",
      variety: "CSH-16",
      sowingMonth: "June-July",
      harvestMonth: "October-November",
      duration: "110-120 days",
      season: "Kharif",
      region: "Karnataka",
      temperatureRange: "25-35°C",
      rainfallRequirement: "400-600mm",
      soilType: "Black soil",
      tips: [
        "Drought resistant",
        "Good fodder value",
        "Suitable for dryland"
      ]
    },

    // West Bengal Crops
    {
      crop: "Rice",
      variety: "IET-4786",
      sowingMonth: "June-July",
      harvestMonth: "November-December",
      duration: "135-140 days",
      season: "Kharif",
      region: "West Bengal",
      temperatureRange: "25-35°C",
      rainfallRequirement: "1200-1500mm",
      soilType: "Clay",
      tips: [
        "High yielding variety",
        "Flood tolerant",
        "Good grain quality"
      ]
    },
    {
      crop: "Jute",
      variety: "JRO-204",
      sowingMonth: "March-April",
      harvestMonth: "July-August",
      duration: "120-150 days",
      season: "Summer",
      region: "West Bengal",
      temperatureRange: "25-35°C",
      rainfallRequirement: "1000-1200mm",
      soilType: "Clay loam",
      tips: [
        "Fiber crop",
        "High humidity requirement",
        "Needs standing water"
      ]
    },
    {
      crop: "Potato",
      variety: "Kufri Jyoti",
      sowingMonth: "November-December",
      harvestMonth: "February-March",
      duration: "70-90 days",
      season: "Rabi",
      region: "West Bengal",
      temperatureRange: "15-25°C",
      rainfallRequirement: "300-400mm",
      soilType: "Sandy loam",
      tips: [
        "Short duration variety",
        "Good for West Bengal",
        "High yielding"
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
    // Filter calendar data based on selections with fallbacks
    let filtered = mockCalendarData.filter(item => {
      const matchState = selectedState === "All States" ? true : item.region === selectedState;
      const matchSeason = selectedSeason === "All Seasons" ? true : item.season === selectedSeason;
      return matchState && matchSeason;
    });

    // If no region-specific data, show national suggestions for the selected season
    if (filtered.length === 0) {
      filtered = mockCalendarData.filter(item => selectedSeason === "All Seasons" ? true : item.season === selectedSeason)
        // group by crop and pick a representative entry
        .reduce((acc: CropCalendar[], cur) => {
          if (!acc.find(a => a.crop === cur.crop)) acc.push(cur);
          return acc;
        }, [] as CropCalendar[]);
    }

    setCropCalendar(filtered);
    setWeatherInfo(mockWeatherData);
  }, [selectedState, selectedSeason]);

  // Helper: return detailed guide for a crop
  const getDetailedGuide = (crop: CropCalendar) => {
    const common: string[] = [
      `Select certified seeds of variety ${crop.variety}`,
      `Prepare field: plough, level and apply required FYM`,
      `Sowing/Transplanting: ${crop.sowingMonth}`,
      `Irrigation and nutrient management as per crop stage`,
      `Harvest around: ${crop.harvestMonth}`
    ];

    const cropSpecific: Record<string, string[]> = {
      Rice: [
        'Nursery preparation and 20-25 day old seedlings for transplanting',
        'Keep standing water of 2-3 cm after transplanting',
        'Split nitrogen application (basal, tillering, panicle initiation)'
      ],
      Wheat: [
        'Sow timely after paddy to avoid heat stress',
        'Opt for seed rate 100-125 kg/ha and proper seed treatment',
        'Irrigate at CRI and booting stages'
      ],
      Maize: [
        'Plant 2-3 seeds per hill and thin to 1 healthy plant',
        'Side-dress nitrogen at knee-high stage',
        'Keep weed free first 30 days'
      ],
      Cotton: [
        'Maintain recommended spacing and use Bt varieties where appropriate',
        'Apply basal and top dressing as per soil test',
        'Monitor for bollworms and use IPM'
      ],
      Sugarcane: [
        'Use 3-bud setts for sowing and maintain moisture',
        'Apply organic manure and split fertilizer applications',
        'Ratoon management for subsequent crops'
      ],
      Potato: [
        'Use certified seed tubers and treat against pests',
        'Earthing up before tuber initiation',
        'Irrigate regularly to avoid tuber cracking'
      ],
      Tomato: [
        'Use nursery raised seedlings and transplant carefully',
        'Support staking and manage irrigation during fruit set',
        'Watch for late blight and bacterial wilt'
      ],
      Groundnut: [
        'Sow in well-drained soils and maintain calcium levels',
        'Avoid waterlogging and harvest at proper pod maturity'
      ],
      Soybean: [
        'Plant at the onset of monsoon and use rhizobium inoculant',
        'Weed control early improves yields'
      ]
    };

    const specific = cropSpecific[crop.crop] || [];
    return [...common, ...specific];
  };

  // Dialog state
  const [openGuide, setOpenGuide] = useState(false);
  const [guideCrop, setGuideCrop] = useState<CropCalendar | null>(null);

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

                      <Button variant="outline" className="w-full" onClick={() => { setGuideCrop(crop); setOpenGuide(true); }}>
                        Get Detailed Guide
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      {/* Detailed Guide Modal */}
      {openGuide && guideCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg w-11/12 md:w-2/3 max-h-[80vh] overflow-auto p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Detailed Guide — {guideCrop.crop} ({guideCrop.variety})</h3>
                <p className="text-sm text-muted-foreground">Region: {guideCrop.region} • Season: {guideCrop.season}</p>
              </div>
              <div>
                <Button variant="ghost" onClick={() => setOpenGuide(false)}>Close</Button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium">Sowing Window</h4>
                <p className="text-sm text-muted-foreground">{guideCrop.sowingMonth} — Harvest: {guideCrop.harvestMonth} (Duration: {guideCrop.duration})</p>
              </div>

              <div>
                <h4 className="font-medium">Step-by-step Guide</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground mt-2">
                  {getDetailedGuide(guideCrop).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-medium">Quick Tips</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-2">
                  {guideCrop.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
};

export default SowingCalendar;