import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CropRecommendation from "./pages/CropRecommendation";
import CropMonitoring from "./pages/CropMonitoring";
import GovernmentUpdates from "./pages/GovernmentUpdates";
import SowingCalendar from "./pages/SowingCalendar";
import AdminDashboard from "./pages/AdminDashboard";
import { Chatbot } from "@/components/Chatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crop-recommendation"
              element={
                <ProtectedRoute>
                  <CropRecommendation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crop-monitoring"
              element={
                <ProtectedRoute>
                  <CropMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/government-updates"
              element={
                <ProtectedRoute>
                  <GovernmentUpdates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sowing-calendar"
              element={
                <ProtectedRoute>
                  <SowingCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Chatbot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
