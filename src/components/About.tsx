import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Target } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-slide-up">
            About This Project
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            A final year computer science project developed at IMS Engineering College, 
            Ghaziabad, aimed at revolutionizing agricultural practices through AI technology.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-scale-in" style={{animationDelay: '0.4s'}}>
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 animate-float" />
                <CardTitle>Academic Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Final year project in Computer Science at IMS Engineering College, 
                  combining academic research with practical agricultural solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-scale-in" style={{animationDelay: '0.6s'}}>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4 animate-float" style={{animationDelay: '0.5s'}} />
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Developed by Vitul Rajput, Isha Rajput, and Kanishka Gaur under 
                  the guidance of Dr. Sonia Juneja, Head of Computer Science Department.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-scale-in" style={{animationDelay: '0.8s'}}>
              <CardHeader>
                <Target className="h-12 w-12 text-primary mx-auto mb-4 animate-float" style={{animationDelay: '1s'}} />
                <CardTitle>Real Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Addressing real challenges faced by Indian farmers through innovative 
                  AI solutions and accessible technology platforms.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 hover:shadow-xl transition-all duration-300 animate-fade-in" style={{animationDelay: '1s'}}>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Project Objectives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Primary Goals</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Provide real-time government scheme updates</li>
                    <li>• AI-powered crop recommendation system</li>
                    <li>• Weather-based sowing advisory</li>
                    <li>• Crop health monitoring through image analysis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Expected Outcomes</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Improved crop yield for farmers</li>
                    <li>• Reduced agricultural losses</li>
                    <li>• Better access to government benefits</li>
                    <li>• Enhanced decision-making support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default About;