import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Brain, MessageSquare, Zap, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

const AIAgents = () => {
  const capabilities = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: "Conversational AI",
      description: "Natural language processing for human-like interactions"
    },
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "Machine Learning",
      description: "Adaptive systems that learn and improve over time"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Task Automation",
      description: "Intelligent automation for complex business processes"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    }
  ];

  const useCases = [
    "Customer Support Chatbots",
    "Sales Assistant Agents", 
    "Content Generation Tools",
    "Data Analysis Agents",
    "Process Automation Bots",
    "Personal Assistant AI"
  ];

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      {/* Hero Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/10">
              <Bot className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">AI Agents</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Revolutionary AI-powered agents that enhance productivity, automate complex tasks, 
            and provide intelligent solutions for your business challenges.
          </p>
        </div>
      </div>

      {/* Capabilities Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">AI Agent Capabilities</h2>
            <p className="text-lg text-muted-foreground">
              Discover the power of artificial intelligence tailored to your business needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {capabilities.map((capability, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {capability.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{capability.title}</h3>
                      <p className="text-muted-foreground">{capability.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="card-glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                AI Agent Applications
              </CardTitle>
              <CardDescription>
                Versatile AI agents designed for various business functions and industries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="p-4 bg-secondary/20 rounded-lg">
                    <span className="font-medium">{useCase}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Why Choose Our AI Agents?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "24/7 Availability", desc: "Your AI agents work around the clock, providing continuous support and service" },
              { title: "Scalable Solutions", desc: "Handle thousands of interactions simultaneously without compromising quality" },
              { title: "Cost Effective", desc: "Reduce operational costs while improving service quality and response times" }
            ].map((benefit, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-primary">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Implementation Process */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Implementation Process</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Analysis & Design", desc: "Understanding your needs and designing the perfect AI solution" },
              { step: "02", title: "Training & Testing", desc: "Training the AI with your data and rigorous testing phases" },
              { step: "03", title: "Deploy & Optimize", desc: "Seamless deployment with continuous monitoring and optimization" }
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
              <h2 className="text-3xl font-bold mb-4 text-glow">Ready to Deploy AI Agents?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's explore how AI agents can transform your business operations and customer experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="glow-effect">
                    Discuss Your AI Needs
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

export default AIAgents;