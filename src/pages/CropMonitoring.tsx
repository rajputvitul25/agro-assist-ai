import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, ArrowLeft, Upload, Leaf, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  cropType: string;
  healthStatus: "healthy" | "mild_issue" | "serious_issue";
  confidence: number;
  issues: string[];
  recommendations: string[];
  growthStage: string;
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
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock analysis results
    const mockResults: AnalysisResult[] = [
      {
        cropType: "Tomato",
        healthStatus: "healthy",
        confidence: 94,
        issues: [],
        recommendations: [
          "Continue current care routine",
          "Monitor for early blight during humid weather",
          "Ensure adequate spacing for air circulation"
        ],
        growthStage: "Flowering Stage"
      },
      {
        cropType: "Wheat",
        healthStatus: "mild_issue",
        confidence: 87,
        issues: ["Possible nitrogen deficiency", "Slight yellowing of lower leaves"],
        recommendations: [
          "Apply nitrogen-rich fertilizer",
          "Check soil moisture levels",
          "Monitor for pest activity"
        ],
        growthStage: "Vegetative Stage"
      },
      {
        cropType: "Rice",
        healthStatus: "serious_issue",
        confidence: 91,
        issues: ["Brown spot disease detected", "Fungal infection signs"],
        recommendations: [
          "Apply fungicide treatment immediately",
          "Improve field drainage",
          "Remove affected plants",
          "Consult agricultural extension officer"
        ],
        growthStage: "Tillering Stage"
      }
    ];

    // Random selection for demo
    const result = mockResults[Math.floor(Math.random() * mockResults.length)];
    setAnalysis(result);
    setIsAnalyzing(false);
    
    toast({
      title: "Analysis Complete",
      description: `${result.cropType} identified with ${result.confidence}% confidence`,
    });
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
                  <div className="space-y-6">
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

                    {analysis.issues.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Issues Detected</h4>
                        <ul className="space-y-1">
                          {analysis.issues.map((issue, index) => (
                            <li key={index} className="text-muted-foreground flex items-start gap-2">
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
                          <li key={index} className="text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        Save Report
                      </Button>
                      <Button variant="outline" className="flex-1">
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