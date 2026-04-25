import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, LogIn, LogInIcon, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login_at: string | null;
  login_count: number;
}

interface AuthEvent {
  id: number;
  user_id: string | null;
  email: string;
  event_type: string;
  status: string;
  details: string | null;
  occurred_at: string;
}

interface AuthOverview {
  database_path: string;
  summary: {
    total_users: number;
    total_logins: number;
    failed_logins: number;
    latest_activity_at: string | null;
  };
  users: AuthUser[];
  events: AuthEvent[];
}

const AdminDashboard = () => {
  const { getAuthOverview, user } = useAuth();
  const [overview, setOverview] = useState<AuthOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "events">("users");

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await getAuthOverview();
      if (data) {
        setOverview(data);
      } else {
        toast.error("Failed to load admin data. Make sure the backend server is running.");
      }
    } catch (error) {
      console.error("Error fetching overview:", error);
      toast.error("Error loading admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getEventBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failure":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage and monitor user activity</p>
          </div>
          <Button onClick={fetchOverview} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.summary.total_users || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.summary.total_logins || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overview?.summary.failed_logins || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              <LogInIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {overview?.summary.latest_activity_at 
                  ? new Date(overview.summary.latest_activity_at).toLocaleDateString() 
                  : "No activity"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Users ({overview?.users.length || 0})
          </Button>
          <Button
            variant={activeTab === "events" ? "default" : "outline"}
            onClick={() => setActiveTab("events")}
          >
            <LogInIcon className="mr-2 h-4 w-4" />
            Events ({overview?.events.length || 0})
          </Button>
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>All users who have registered on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Login Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_login_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.login_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!overview?.users || overview.users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Events Table */}
        {activeTab === "events" && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent login and registration events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">{formatDate(event.occurred_at)}</TableCell>
                      <TableCell>{event.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {event.event_type === "login" ? "Login" : "Register"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEventBadgeVariant(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!overview?.events || overview.events.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
