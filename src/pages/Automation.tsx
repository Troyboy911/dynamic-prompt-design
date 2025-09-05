import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Workflow, Clock, TrendingUp, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Automation = () => {
  const benefits = [
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Time Savings",
      description: "Reduce manual work by 80% with intelligent automation"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Improved Efficiency",
      description: "Streamline processes and eliminate bottlenecks"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Error Reduction",
      description: "Minimize human errors with automated workflows"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Scalable Solutions",
      description: "Grow your operations without proportional overhead"
    }
  ];

  const services = [
    "Business Process Automation",
    "API Integration & Development", 
    "Data Processing & Analytics",
    "Workflow Optimization",
    "Custom Automation Tools",
    "Legacy System Integration"
  ];

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      {/* Hero Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/10">
              <Cpu className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">Automation Solutions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your business operations with intelligent automation systems that work 
            around the clock to boost efficiency and reduce costs.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Benefits of Automation</h2>
            <p className="text-lg text-muted-foreground">
              Discover how automation can revolutionize your business operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="card-glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <Workflow className="w-8 h-8 text-primary" />
                Our Automation Services
              </CardTitle>
              <CardDescription>
                Comprehensive automation solutions tailored to your business needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service, index) => (
                  <div key={index} className="p-4 bg-secondary/20 rounded-lg">
                    <span className="font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Common Use Cases</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "E-commerce Operations", desc: "Inventory management, order processing, and customer communication automation" },
              { title: "Financial Processing", desc: "Invoice generation, payment tracking, and financial reporting automation" },
              { title: "Customer Support", desc: "Ticket routing, response automation, and customer journey optimization" }
            ].map((useCase, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-primary">{useCase.title}</h3>
                  <p className="text-muted-foreground">{useCase.desc}</p>
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
              <h2 className="text-3xl font-bold mb-4 text-glow">Ready to Automate Your Business?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's identify automation opportunities and create solutions that drive real results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="glow-effect">
                    Get Automation Assessment
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

export default Automation;