import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Code, Zap, Shield, Users, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

const AppDevelopment = () => {
  const features = [
    {
      icon: <Code className="w-8 h-8 text-primary" />,
      title: "Cross-Platform Development",
      description: "Build once, deploy everywhere with React Native and Flutter"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "High Performance",
      description: "Optimized apps that deliver exceptional user experiences"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Security First",
      description: "Enterprise-grade security and data protection"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "User-Centric Design",
      description: "Intuitive interfaces that users love to interact with"
    }
  ];

  const technologies = [
    "React Native", "Flutter", "Swift", "Kotlin", "React", "Node.js", 
    "Firebase", "AWS", "MongoDB", "PostgreSQL", "REST APIs", "GraphQL"
  ];

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      {/* Hero Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/10">
              <Smartphone className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">App Development</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Custom mobile and web applications that drive engagement, streamline operations, 
            and accelerate your business growth.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Why Choose Our App Development?</h2>
            <p className="text-lg text-muted-foreground">
              We combine cutting-edge technology with user-focused design to create apps that make a difference.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Technologies Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="card-glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Technologies We Use</CardTitle>
              <CardDescription>
                We work with the latest and most reliable technologies to ensure your app is built for the future.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {technologies.map((tech, index) => (
                  <div key={index} className="p-3 bg-secondary/20 rounded-lg text-center">
                    <span className="text-sm font-medium">{tech}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Our Development Process</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Discovery & Planning", desc: "Understanding your requirements and designing the perfect solution" },
              { step: "02", title: "Development & Testing", desc: "Agile development with continuous testing and quality assurance" },
              { step: "03", title: "Launch & Support", desc: "Seamless deployment and ongoing maintenance and support" }
            ].map((phase, index) => (
              <Card key={index} className="card-glass text-center">
                <CardContent className="p-8">
                  <div className="text-4xl font-bold text-primary mb-4">{phase.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{phase.title}</h3>
                  <p className="text-muted-foreground">{phase.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="card-glass">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4 text-glow">Ready to Build Your App?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's discuss your app idea and turn it into a powerful digital solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="glow-effect">
                    Start Your Project
                  </Button>
                </Link>
                <Link to="/solutions">
                  <Button variant="outline" size="lg" className="border-primary/50 hover:border-primary">
                    View All Solutions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppDevelopment;