import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, Calendar, MapPin, Search, Bell, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Update {
  id: string;
  title: string;
  description: string;
  category: "scheme" | "subsidy" | "policy" | "announcement";
  state: string;
  datePublished: string;
  deadline?: string;
  isUrgent: boolean;
  source: string;
  link?: string;
}

const GovernmentUpdates = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<Update[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "scheme", label: "Schemes" },
    { value: "subsidy", label: "Subsidies" },
    { value: "policy", label: "Policies" },
    { value: "announcement", label: "Announcements" }
  ];

  const states = [
    "All States", "Andhra Pradesh", "Assam", "Bihar", "Gujarat", "Haryana", 
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", 
    "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal"
  ];

  // Mock data for government updates
  useEffect(() => {
    const mockUpdates: Update[] = [
      {
        id: "1",
        title: "PM-KISAN 13th Installment Released",
        description: "The 13th installment of PM-KISAN scheme has been released. Eligible farmers will receive ₹2,000 directly to their bank accounts.",
        category: "scheme",
        state: "All States",
        datePublished: "2024-01-15",
        deadline: "2024-02-15",
        isUrgent: true,
        source: "Ministry of Agriculture",
        link: "https://pmkisan.gov.in"
      },
      {
        id: "2",
        title: "Pradhan Mantri Fasal Bima Yojana - New Guidelines",
        description: "Updated guidelines for crop insurance scheme. Premium rates reduced for Kharif 2024 season.",
        category: "policy",
        state: "All States",
        datePublished: "2024-01-12",
        deadline: "2024-03-31",
        isUrgent: false,
        source: "Department of Agriculture",
        link: "https://pmfby.gov.in"
      },
      {
        id: "3",
        title: "Subsidy for Organic Farming Certification",
        description: "Punjab government announces 100% subsidy for organic farming certification for small and marginal farmers.",
        category: "subsidy",
        state: "Punjab",
        datePublished: "2024-01-10",
        deadline: "2024-04-30",
        isUrgent: false,
        source: "Punjab Agricultural Department"
      },
      {
        id: "4",
        title: "Kisan Credit Card Interest Rate Reduction",
        description: "Interest rate for Kisan Credit Card reduced to 4% for loans up to ₹3 lakh. Apply before the deadline.",
        category: "announcement",
        state: "All States",
        datePublished: "2024-01-08",
        deadline: "2024-02-28",
        isUrgent: true,
        source: "NABARD"
      },
      {
        id: "5",
        title: "Maharashtra Drought Relief Package",
        description: "Special relief package announced for drought-affected farmers in Marathwada region. Input subsidy increased to 75%.",
        category: "scheme",
        state: "Maharashtra",
        datePublished: "2024-01-05",
        isUrgent: true,
        source: "Maharashtra Government"
      },
      {
        id: "6",
        title: "Solar Pump Subsidy Scheme Extended",
        description: "PM-KUSUM scheme for solar pumps extended till December 2024. 90% subsidy available for SC/ST farmers.",
        category: "subsidy",
        state: "All States",
        datePublished: "2024-01-03",
        deadline: "2024-12-31",
        isUrgent: false,
        source: "Ministry of New & Renewable Energy"
      }
    ];

    setUpdates(mockUpdates);
    setFilteredUpdates(mockUpdates);
  }, []);

  // Filter updates based on search and selections
  useEffect(() => {
    let filtered = updates;

    if (searchTerm) {
      filtered = filtered.filter(update =>
        update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(update => update.category === selectedCategory);
    }

    if (selectedState !== "all" && selectedState !== "All States") {
      filtered = filtered.filter(update => 
        update.state === selectedState || update.state === "All States"
      );
    }

    setFilteredUpdates(filtered);
  }, [searchTerm, selectedCategory, selectedState, updates]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "scheme": return "bg-blue-100 text-blue-800";
      case "subsidy": return "bg-green-100 text-green-800";
      case "policy": return "bg-purple-100 text-purple-800";
      case "announcement": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDeadlineNear = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
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
              <Megaphone className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Government Updates</span>
            </div>
          </div>
          <Button size="sm" className="hidden md:flex">
            <Bell className="h-4 w-4 mr-2" />
            Subscribe to Alerts
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Latest Government Updates</h1>
            <p className="text-muted-foreground">
              Stay informed about the latest schemes, subsidies, and policies for farmers
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search updates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state === "All States" ? "all" : state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedState("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Updates List */}
          <div className="space-y-6">
            {filteredUpdates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No updates found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              filteredUpdates.map((update) => (
                <Card key={update.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={getCategoryColor(update.category)}>
                          {update.category.charAt(0).toUpperCase() + update.category.slice(1)}
                        </Badge>
                        {update.isUrgent && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                        {update.deadline && isDeadlineNear(update.deadline) && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Deadline Soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(update.datePublished)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {update.state}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{update.title}</h3>
                    <p className="text-muted-foreground mb-4">{update.description}</p>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Source:</span> {update.source}
                        {update.deadline && (
                          <span className="ml-4">
                            <span className="font-medium">Deadline:</span> {formatDate(update.deadline)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {update.link && (
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Official Link
                          </Button>
                        )}
                        <Button size="sm">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentUpdates;