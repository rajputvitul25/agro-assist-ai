import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Megaphone, Calendar, MapPin, Search, Bell, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  applyLink?: string;
  applyLabel?: string;
}

const GovernmentUpdates = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<Update[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const { toast } = useToast();
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

  // Load updates from the aggregated public JSON (written by tools/fetchGovUpdates.js)
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const resp = await fetch(`/gov-updates.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!resp.ok) throw new Error('No gov updates file');
        const data = await resp.json();
        const items: Update[] = (data.items || []).map((it: any, idx: number) => ({
          id: it.id || String(idx),
          title: it.title || '',
          description: it.description || '',
          category: it.category || 'announcement',
          state: it.state || 'All States',
          datePublished: it.datePublished || new Date().toISOString(),
          deadline: it.deadline || undefined,
          isUrgent: it.isUrgent || false,
          source: it.source || 'Government',
          link: it.link || undefined,
          applyLink: it.applyLink || undefined,
          applyLabel: it.applyLabel || undefined
        }));

        if (mounted) {
          setUpdates(items);
          setFilteredUpdates(items);
        }
      } catch (err) {
        console.warn('Could not load gov updates, falling back to mock data');
      }
    };

    load();

    // Poll for updates every 60 seconds to show near real-time changes
    const iv = setInterval(load, 60 * 1000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // Subscription handling (stored in localStorage)
  const saveSubscriber = (email: string) => {
    try {
      const key = "gov-subscribers";
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      if (list.includes(email)) {
        toast({ title: "Already subscribed", description: `${email} is already in the subscriber list.` });
        return false;
      }
      list.push(email);
      localStorage.setItem(key, JSON.stringify(list));
      toast({ title: "Subscribed", description: `You will receive alerts at ${email}` });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: "Subscription failed", description: "Could not save your subscription locally." });
      return false;
    }
  };

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
          <Button size="sm" onClick={() => setSubscribeOpen(true)}>
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

          {/* Subscribe Dialog */}
          <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subscribe to Alerts</DialogTitle>
                <DialogDescription>Enter your email to receive government update alerts.</DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-3">
                <Input placeholder="you@example.com" value={subscriberEmail} onChange={(e) => setSubscriberEmail(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setSubscribeOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    const email = (subscriberEmail || "").trim();
                    if (!email || !email.includes("@")) {
                      toast({ title: "Invalid email", description: "Please provide a valid email address." });
                      return;
                    }
                    if (saveSubscriber(email)) {
                      setSubscribeOpen(false);
                      setSubscriberEmail("");
                    }
                  }}>Subscribe</Button>
                </div>
              </div>

            </DialogContent>
          </Dialog>

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
                        {update.applyLink && update.applyLink !== update.link && (
                            <Button size="sm" onClick={() => window.open(update.applyLink, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {update.applyLabel || "Apply Now"}
                            </Button>
                        )}
                        {update.link && (
                            <Button variant="outline" size="sm" onClick={() => window.open(update.link, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Official Link
                            </Button>
                        )}
                          <Button size="sm" variant="secondary" onClick={() => { setSelectedUpdate(update); setDetailsOpen(true); }}>
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUpdate ? selectedUpdate.title : "Update Details"}</DialogTitle>
            <DialogDescription>
              More information about the selected government update.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {selectedUpdate ? (
              <>
                <p className="text-muted-foreground mb-2">{selectedUpdate.description}</p>
                <p className="text-sm text-muted-foreground"><strong>Source:</strong> {selectedUpdate.source}</p>
                {selectedUpdate.deadline && <p className="text-sm text-muted-foreground"><strong>Deadline:</strong> {formatDate(selectedUpdate.deadline)}</p>}
                {selectedUpdate.link && (
                  <Button variant="link" className="mt-4" onClick={() => window.open(selectedUpdate.link, "_blank")}>
                    Open Official Link
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No update selected.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentUpdates;