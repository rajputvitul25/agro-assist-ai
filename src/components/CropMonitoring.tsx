import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Eye, CheckCircle, AlertTriangle, X } from "lucide-react";

const CropMonitoring = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult({
        health: "Good",
        growthStage: "Vegetative",
        confidence: 94,
        issues: [],
        recommendations: [
          "Continue current watering schedule",
          "Consider adding nitrogen-rich fertilizer",
          "Monitor for early signs of pests in the coming week"
        ]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section id="monitoring" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-earth to-warning rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-earth-foreground" />
            </div>
            <span className="text-earth font-semibold">Image Analysis</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Crop Health
            <span className="block text-primary">Monitoring</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Upload images of your crops for instant AI-powered health analysis and receive personalized recommendations for optimal growth.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-primary" />
                Upload Crop Image
              </h3>
              
              {!uploadedImage ? (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-card-foreground mb-2">
                    Upload Crop Photo
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Click to browse or drag and drop your image here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG files up to 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded crop" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {uploadedImage && !analysisResult && (
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full mt-4 bg-gradient-to-r from-primary to-success hover:from-primary-hover hover:to-success/90"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Analyze Crop Health
                    </>
                  )}
                </Button>
              )}
            </Card>

            {/* Results Section */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-success" />
                Analysis Results
              </h3>

              {!analysisResult ? (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Upload an image to see AI analysis results
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Health Status */}
                  <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-medium text-card-foreground">Crop Health</p>
                        <p className="text-sm text-muted-foreground">Overall condition</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-success">{analysisResult.health}</p>
                      <p className="text-sm text-muted-foreground">{analysisResult.confidence}% confidence</p>
                    </div>
                  </div>

                  {/* Growth Stage */}
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                      </div>
                      <p className="font-medium text-card-foreground">Growth Stage</p>
                    </div>
                    <p className="text-primary font-semibold">{analysisResult.growthStage}</p>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium text-card-foreground mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Analyze Another Image
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CropMonitoring;