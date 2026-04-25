import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ClipboardList,
  History,
  Leaf,
  Loader2,
  ScanSearch,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";


const API_BASE_URL = "http://localhost:8000";
const HISTORY_KEY = "crop_monitoring_history_v2";

const CROPS = [
  {
    value: "Sugarcane",
    diseases: ["Healthy", "Mosaic", "Red Rot", "Rust", "Yellow Leaf Disease"],
  },
  {
    value: "Wheat",
    diseases: ["Healthy", "Brown Rust", "Powdery Mildew", "Septoria", "Yellow Rust"],
  },
  {
    value: "Rice",
    diseases: ["Healthy", "Bacterial Leaf Blight", "Brown Spot", "Leaf Blast"],
  },
] as const;

interface ModelInfo {
  architecture: string;
  validation_accuracy?: number;
  model_loaded: boolean;
  supported_diseases: Record<string, string[]>;
  per_crop_accuracy?: Record<string, number>;
}

interface TopPrediction {
  crop: string;
  disease: string;
  confidence: number;
}

interface AnalysisResult {
  crop_type: string;
  disease: string;
  confidence: number;
  health_status: string;
  ai_insights: string[];
  disease_risks: string[];
  pest_risks: string[];
  recommendations: string[];
  growth_stage: string;
  yield_prediction: string;
  profitability_score: number;
  model_capability?: string | null;
  prediction_note?: string | null;
  debug?: {
    top_predictions?: TopPrediction[];
    validation_accuracy?: number;
  };
}

interface ScanHistoryItem {
  timestamp: string;
  crop: string;
  disease: string;
  confidence: number;
  health_status: string;
}

const CropMonitoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        localStorage.removeItem(HISTORY_KEY);
      }
    }

    const loadModelInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/model-info`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setModelInfo(data);
      } catch {
        setModelInfo(null);
      }
    };

    loadModelInfo();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const currentCrop = useMemo(
    () => CROPS.find((crop) => crop.value === selectedCrop),
    [selectedCrop]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
  };

  const persistHistory = (nextHistory: ScanHistoryItem[]) => {
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const analyzeImage = async () => {
    if (!selectedCrop || !selectedFile) {
      toast({
        title: "Missing input",
        description: "Select one crop and one leaf image before starting analysis.",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("crop_hint", selectedCrop);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Prediction failed" }));
        throw new Error(error.detail || "Prediction failed");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      const nextHistory = [
        {
          timestamp: new Date().toISOString(),
          crop: data.crop_type,
          disease: data.disease,
          confidence: data.confidence,
          health_status: data.health_status,
        },
        ...history,
      ].slice(0, 8);
      persistHistory(nextHistory);

      toast({
        title: "Analysis complete",
        description: `${data.crop_type} leaf classified as ${data.disease} (${data.confidence}% confidence).`,
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Unable to reach the crop monitoring backend.";
      toast({
        title: "Analysis failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const healthBadge = (status: string) => {
    if (status === "healthy") {
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Healthy</Badge>;
    }
    return <Badge variant="destructive">Attention Needed</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Leaf className="h-5 w-5 text-primary" />
                Crop Monitoring
              </div>
              <p className="text-sm text-muted-foreground">
                Real leaf-image analysis for sugarcane, wheat, and rice
              </p>
            </div>
          </div>
          <Badge variant={modelInfo?.model_loaded ? "default" : "secondary"}>
            {modelInfo?.model_loaded ? "Model Ready" : "Backend Check Needed"}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-[1.6fr_1fr]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ScanSearch className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-bold">Crop Health Scanner</h1>
                </div>
                <p className="text-muted-foreground">
                  Select the crop first, upload one clear leaf image, and the backend will classify
                  against the trained disease set for that crop only.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CROPS.map((crop) => (
                    <Badge key={crop.value} variant="outline">
                      {crop.value}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Model Snapshot
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Architecture: {modelInfo?.architecture || "Unavailable"}</p>
                  <p>
                    Validation accuracy:{" "}
                    {modelInfo?.validation_accuracy ? `${modelInfo.validation_accuracy}%` : "Unavailable"}
                  </p>
                  <p>
                    Crop-specific guidance: select the crop to improve classification specificity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!modelInfo?.model_loaded && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Backend model not confirmed</AlertTitle>
              <AlertDescription>
                The frontend is ready, but the page could not confirm a loaded backend model. Start the
                FastAPI service if analysis requests fail.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  Upload Leaf Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Select Crop</Label>
                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose sugarcane, wheat, or rice" />
                    </SelectTrigger>
                    <SelectContent>
                      {CROPS.map((crop) => (
                        <SelectItem key={crop.value} value={crop.value}>
                          {crop.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaf-image">Leaf Image</Label>
                  <Input id="leaf-image" type="file" accept="image/*" onChange={handleFileChange} />
                  <p className="text-xs text-muted-foreground">
                    Best results come from one well-lit leaf with visible symptoms and minimal background clutter.
                  </p>
                </div>

                {currentCrop && (
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Supported {currentCrop.value} classes</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentCrop.diseases.map((disease) => (
                        <Badge key={disease} variant="outline">
                          {disease}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {previewUrl && (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <img
                      src={previewUrl}
                      alt="Selected crop leaf"
                      className="h-72 w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" onClick={analyzeImage} disabled={!selectedCrop || !selectedFile || isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanSearch className="mr-2 h-4 w-4" />
                        Analyze Leaf
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearScan} disabled={isLoading}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Latest Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-muted-foreground">
                    <ShieldCheck className="mb-4 h-14 w-14 opacity-25" />
                    <p className="max-w-sm">
                      Run a scan to see crop diagnosis, recommendations, confidence, and alternative predictions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{result.crop_type}</p>
                        <h2 className="text-2xl font-bold">{result.disease}</h2>
                      </div>
                      {healthBadge(result.health_status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence</span>
                        <span>{result.confidence}%</span>
                      </div>
                      <Progress value={result.confidence} />
                    </div>

                    {result.prediction_note && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Scan Note</AlertTitle>
                        <AlertDescription>{result.prediction_note}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-medium">Yield Outlook</p>
                        <p className="mt-2 text-sm text-muted-foreground">{result.yield_prediction}</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-medium">Profitability Score</p>
                        <p className="mt-2 text-2xl font-semibold">{result.profitability_score}/100</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">AI Insights</h3>
                      <div className="space-y-2">
                        {result.ai_insights.map((insight) => (
                          <div key={insight} className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-medium">Disease Risks</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.disease_risks.map((item) => (
                            <Badge key={item} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm font-medium">Pest Risks</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.pest_risks.map((item) => (
                            <Badge key={item} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Recommendations</h3>
                      <div className="space-y-2">
                        {result.recommendations.map((recommendation) => (
                          <div key={recommendation} className="rounded-lg border border-border p-3 text-sm">
                            {recommendation}
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.debug?.top_predictions && result.debug.top_predictions.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold">Top Alternatives</h3>
                        <div className="space-y-2">
                          {result.debug.top_predictions.map((prediction) => (
                            <div
                              key={`${prediction.crop}-${prediction.disease}`}
                              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                            >
                              <div>
                                <p className="font-medium">{prediction.disease}</p>
                                <p className="text-muted-foreground">{prediction.crop}</p>
                              </div>
                              <Badge variant="secondary">{prediction.confidence}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Scan History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Your recent scan results will appear here after the first successful analysis.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={`${item.timestamp}-${item.crop}`} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {item.crop} - {item.disease}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {healthBadge(item.health_status)}
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Confidence</span>
                          <Progress value={item.confidence} className="h-2" />
                          <span>{item.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Accuracy Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border border-border p-4">
                  Use one leaf per image whenever possible. Mixed canopies, soil, and hands in the frame reduce classifier confidence.
                </div>
                <div className="rounded-lg border border-border p-4">
                  Capture symptoms from 20-40 cm away in natural daylight. Blur and heavy shadow make disease boundaries harder to classify.
                </div>
                <div className="rounded-lg border border-border p-4">
                  If confidence is low, retake the photo from a second plant and compare whether the diagnosis stays consistent.
                </div>
                <div className="rounded-lg border border-border p-4">
                  This model is trained only for sugarcane, wheat, and rice leaf classes shown above. Other crops may produce unreliable output.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropMonitoring;
