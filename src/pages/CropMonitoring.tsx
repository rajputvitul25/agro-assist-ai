import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, ArrowLeft, Upload, Leaf, AlertTriangle, CheckCircle, Brain, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const logger = console;

interface AnalysisResult {
  cropType: string;
  healthStatus: "healthy" | "mild_issue" | "serious_issue";
  confidence: number;
  issues: string[];
  recommendations: string[];
  growthStage: string;
  aiInsights?: string[];
  diseaseRisks?: string[];
  pestRisks?: string[];
  yieldPrediction?: string;
  profitabilityScore?: number;
}

const CropMonitoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notes, setNotes] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    try {
      // Convert base64 image to blob
      const base64Data = selectedImage.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });
      
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', blob, 'crop-image.jpg');
      
      // Call ML backend API
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('API error: ' + response.statusText);
      }
      
      const result = await response.json();
      
      // Format result to match our interface
      const analysis: AnalysisResult = {
        cropType: result.crop_type,
        healthStatus: result.health_status as any,
        confidence: result.confidence,
        issues: result.disease !== 'Healthy' ? [result.disease] : [],
        recommendations: result.recommendations,
        growthStage: result.growth_stage,
        aiInsights: result.ai_insights,
        diseaseRisks: result.disease_risks,
        pestRisks: result.pest_risks,
        yieldPrediction: result.yield_prediction,
        profitabilityScore: result.profitability_score
      };
      
      setAnalysis(analysis);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `${analysis.cropType} detected - ${analysis.cropType === 'Healthy' ? 'Plant is healthy' : analysis.issues[0]}`
      });
    } catch (error) {
      setIsAnalyzing(false);
      logger.error('Prediction error:', error);
      toast({
        title: "Analysis Error",
        description: "Could not connect to ML backend. Check if server is running on http://localhost:8000",
        variant: "destructive"
      });
      
      // Fallback to mock data if API fails
      const mockResults: AnalysisResult[] = [
        {
          cropType: "Sugarcane",
          healthStatus: "healthy",
          confidence: 92,
          issues: [],
          recommendations: [
            "Maintain drip irrigation schedule for optimal growth",
            "Monitor for Red Rot disease during high humidity",
            "Apply balanced NPK (120:60:60) in splits",
            "Prepare for harvest in 12-15 months"
          ],
          growthStage: "Vegetative Stage",
          aiInsights: [
            "🤖 Yield Prediction: 78-82 tonnes/hectare based on current growth",
            "🤖 Climate Alert: Low pest pressure detected this season",
            "🤖 Profit Forecast: Market prices trending upward—high profitability expected",
            "🤖 Water Efficiency: Switch 40% to drip irrigation to save 30% water"
          ],
          diseaseRisks: ["Red Rot (monitor in high humidity)", "Sugarcane Mosaic Virus"],
          pestRisks: ["Sugarcane Borer", "Scale Insects"],
          yieldPrediction: "78-82 tonnes/hectare",
          profitabilityScore: 85
        }
      ];
      
      setAnalysis(mockResults[0]);
    }
  };

  // Quick local analysis fallback (runs in-browser using simple pixel heuristics)
  const analyzeImageLocal = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);

    try {
      const img = new Image();
      img.src = selectedImage;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unsupported');

      // downscale to speed up analysis
      const w = 224;
      const h = Math.round((img.height / img.width) * 224) || 224;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const data = ctx.getImageData(0, 0, w, h).data;
      let greenCount = 0;
      let brownCount = 0;
      let yellowCount = 0;
      let total = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        total++;

        // simple heuristics: green, brown/dark, yellowish
        if (g > r + 15 && g > b + 15 && g > 80) greenCount++;
        if (r > 100 && g > 60 && b < 80 && r - g > 10) yellowCount++;
        if (r > 80 && g < 90 && b < 80 && r - g > 20) brownCount++;
      }

      const greenRatio = (greenCount / total) * 100;
      const brownRatio = (brownCount / total) * 100;
      const yellowRatio = (yellowCount / total) * 100;

      // Decide health status
      let healthStatus: AnalysisResult['healthStatus'] = 'healthy';
      if (brownRatio > 8 || yellowRatio > 10) healthStatus = 'serious_issue';
      else if (brownRatio > 3 || yellowRatio > 5) healthStatus = 'mild_issue';

      // Heuristic crop detection by dimensions/leaf color (very rough)
      let cropType = 'Unknown Crop';
      if (greenRatio > 50) cropType = 'Rice / Leafy Crop';
      else if (greenRatio > 35) cropType = 'Wheat-like Crop';
      else cropType = 'Sugarcane-like Crop';

      // Suggest likely issue
      let issues: string[] = [];
      let recommendations: string[] = [];

      if (healthStatus === 'healthy') {
        issues = [];
        recommendations = [
          'Maintain current irrigation and fertiliser schedule',
          'Monitor fields weekly for pest/disease symptoms',
          'Keep records and photos for trend tracking'
        ];
      } else {
        if (brownRatio > 8) {
          issues.push('Leaf spots / necrosis (possible fungal or bacterial infection)');
          recommendations.push('Isolate affected area, remove severely infected leaves, apply appropriate fungicide');
        }
        if (yellowRatio > 8) {
          issues.push('Chlorosis / nutrient deficiency or viral infection');
          recommendations.push('Test soil for N/P/K and Zn; apply corrective fertilizer, consider foliar feed');
        }
        if (brownRatio > 3 && yellowRatio < 5) {
          recommendations.push('Improve drainage and reduce humidity where possible');
        }
      }

      const confEstimate = Math.max(50, Math.round(100 - Math.min(90, brownRatio * 4 + yellowRatio * 3)));

      const localResult: AnalysisResult = {
        cropType,
        healthStatus,
        confidence: confEstimate,
        issues,
        recommendations,
        growthStage: 'Estimated Mid-Growth',
        aiInsights: [
          `Green cover: ${greenRatio.toFixed(1)}%`,
          `Brown spots: ${brownRatio.toFixed(1)}%`,
          `Yellowing: ${yellowRatio.toFixed(1)}%`,
          'Quick offline analysis — for precise diagnosis use the ML backend.'
        ],
        diseaseRisks: issues.length ? ['Possible fungal/bacterial leaf diseases'] : [],
        pestRisks: [],
        yieldPrediction: healthStatus === 'healthy' ? 'Normal expected yield' : 'Reduced yield potential',
        profitabilityScore: healthStatus === 'healthy' ? 80 : 45
      };

      setAnalysis(localResult);
      setIsAnalyzing(false);
      toast({ title: 'Quick Analysis Complete', description: `${cropType} — ${healthStatus.replace('_', ' ')}` });
    } catch (err) {
      setIsAnalyzing(false);
      logger.error('Local analysis error', err);
      toast({ title: 'Analysis Failed', description: 'Offline analysis failed', variant: 'destructive' });
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600";
      case "mild_issue": return "text-yellow-600";
      case "serious_issue": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "mild_issue": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "serious_issue": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Leaf className="h-5 w-5" />;
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
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Crop Health Monitoring</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">AI-Powered Crop Health Analysis</h1>
            <p className="text-muted-foreground">
              Upload photos of your crops to get instant health assessment and recommendations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Crop Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  {selectedImage ? (
                    <div className="space-y-4">
                      <img 
                        src={selectedImage} 
                        alt="Uploaded crop" 
                        className="max-h-64 mx-auto rounded-lg object-cover"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                        <Button 
                          onClick={analyzeImage}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={analyzeImageLocal}
                          disabled={isAnalyzing}
                          title="Quick offline analysis"
                        >
                          Quick Analyze (Offline)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Upload Crop Photo</h3>
                        <p className="text-muted-foreground mb-4">
                          Take a clear photo of your crop leaves, stems, or affected areas
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Select Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Describe any symptoms or concerns you've noticed..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!analysis ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Leaf className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Upload an image to get AI-powered crop health analysis</p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    <div className="text-center pb-4 border-b">
                      <div className="text-2xl font-bold text-foreground mb-2">{analysis.cropType}</div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getHealthStatusIcon(analysis.healthStatus)}
                        <span className={`font-medium ${getHealthStatusColor(analysis.healthStatus)}`}>
                          {analysis.healthStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Growth Stage: {analysis.growthStage}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {analysis.confidence}%
                      </div>
                    </div>

                    {/* AI Insights Section */}
                    {analysis.aiInsights && analysis.aiInsights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          AI Insights
                        </h4>
                        <div className="space-y-2">
                          {analysis.aiInsights.map((insight, index) => (
                            <div key={index} className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yield & Profitability */}
                    {(analysis.yieldPrediction || analysis.profitabilityScore) && (
                      <div className="grid grid-cols-2 gap-2">
                        {analysis.yieldPrediction && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <div className="text-xs text-blue-600 font-semibold">Yield Prediction</div>
                            <div className="text-sm font-bold text-blue-900">{analysis.yieldPrediction}</div>
                          </div>
                        )}
                        {analysis.profitabilityScore && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <div className="text-xs text-green-600 font-semibold">Profitability</div>
                            <div className="text-sm font-bold text-green-900">{analysis.profitabilityScore}/100</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Disease Risks */}
                    {analysis.diseaseRisks && analysis.diseaseRisks.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-orange-600">Disease Risks</h4>
                        <div className="space-y-1">
                          {analysis.diseaseRisks.map((disease, idx) => (
                            <div key={idx} className="text-sm flex items-start gap-2 text-orange-900">
                              <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                              {disease}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pest Risks */}
                    {analysis.pestRisks && analysis.pestRisks.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Pest Risks</h4>
                        <div className="space-y-1">
                          {analysis.pestRisks.map((pest, idx) => (
                            <div key={idx} className="text-sm flex items-start gap-2 text-red-900">
                              <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                              {pest}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.issues.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Issues Detected</h4>
                        <ul className="space-y-1">
                          {analysis.issues.map((issue, index) => (
                            <li key={index} className="text-muted-foreground flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-muted-foreground flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs">
                        Save Report
                      </Button>
                      <Button variant="outline" className="flex-1 text-xs">
                        Share with Expert
                      </Button>
                    </div>
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

export default CropMonitoring;