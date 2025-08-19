import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Megaphone, 
  Calendar, 
  DollarSign, 
  FileText, 
  Bell,
  ArrowRight,
  Star,
  Clock
} from "lucide-react";

const GovernmentUpdates = () => {
  const updates = [
    {
      id: 1,
      title: "PM-KISAN Beneficiary Status Update",
      description: "Check your PM-KISAN benefit status and ensure your KYC is updated for the upcoming installment release.",
      category: "Subsidy",
      urgency: "high",
      date: "2024-01-15",
      amount: "₹2,000",
      icon: DollarSign,
      isNew: true
    },
    {
      id: 2,
      title: "Kharif Season Crop Insurance Deadline",
      description: "Last date to enroll for Pradhan Mantri Fasal Bima Yojana for Kharif crops is approaching.",
      category: "Insurance",
      urgency: "urgent",
      date: "2024-01-20",
      icon: FileText,
      isNew: true
    },
    {
      id: 3,
      title: "Soil Health Card Distribution",
      description: "New batch of Soil Health Cards are available for collection at your nearest agriculture office.",
      category: "Scheme",
      urgency: "medium",
      date: "2024-01-12",
      icon: Star,
      isNew: false
    },
    {
      id: 4,
      title: "Organic Farming Promotion Scheme",
      description: "Apply for financial assistance under Paramparagat Krishi Vikas Yojana for organic farming practices.",
      category: "Grant",
      urgency: "medium",
      date: "2024-01-10",
      amount: "₹50,000/ha",
      icon: DollarSign,
      isNew: false
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'warning';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Subsidy': return 'success';
      case 'Insurance': return 'earth';
      case 'Grant': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <section id="updates" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-warning to-destructive rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-warning-foreground" />
            </div>
            <span className="text-warning font-semibold">Stay Informed</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Government
            <span className="block text-primary">Updates</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay up-to-date with the latest agricultural policies, subsidies, and government schemes designed to support farmers.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Notification Settings */}
          <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">Get instant alerts for urgent government updates</p>
                </div>
              </div>
              <Button variant="outline">
                Enable Notifications
              </Button>
            </div>
          </Card>

          {/* Updates List */}
          <div className="space-y-6">
            {updates.map((update) => (
              <Card key={update.id} className="p-6 hover:shadow-lg transition-all duration-300 border-border/50">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-${getCategoryColor(update.category)}/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <update.icon className={`w-6 h-6 text-${getCategoryColor(update.category)}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-card-foreground">
                          {update.title}
                        </h3>
                        {update.isNew && (
                          <Badge variant="destructive" className="text-xs">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getUrgencyColor(update.urgency) as any} className="text-xs">
                          {update.urgency.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {update.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {update.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(update.date).toLocaleDateString()}</span>
                        </div>
                        {update.amount && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium text-success">{update.amount}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        Read More
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              <Clock className="mr-2 h-4 w-4" />
              View All Updates
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GovernmentUpdates;