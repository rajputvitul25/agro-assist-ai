import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CropRecommendation from "@/components/CropRecommendation";
import CropMonitoring from "@/components/CropMonitoring";
import GovernmentUpdates from "@/components/GovernmentUpdates";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <CropRecommendation />
      <CropMonitoring />
      <GovernmentUpdates />
    </div>
  );
};

export default Index;
