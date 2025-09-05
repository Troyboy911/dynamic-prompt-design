import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Cpu, Globe, Bot, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Solutions = () => {
  const services = [
    {
      icon: <Smartphone className="w-16 h-16 text-primary" />,
      title: "App Development",
      description: "Custom mobile and web applications built with cutting-edge technology and user-centric design.",
      features: ["React Native & Flutter", "Progressive Web Apps", "iOS & Android Native", "Cross-platform Solutions"],
      link: "/solutions/app-development"
    },
    {
      icon: <Cpu className="w-16 h-16 text-primary" />,
      title: "Automation Solutions",
      description: "Streamline your business processes with intelligent automation systems that save time and reduce errors.",
      features: ["Process Automation", "API Integrations", "Workflow Optimization", "Data Processing"],
      link: "/solutions/automation"
    },
    {
      icon: <Globe className="w-16 h-16 text-primary" />,
      title: "Website Development",
      description: "Modern, responsive websites that captivate audiences and drive business growth.",
      features: ["Responsive Design", "SEO Optimization", "E-commerce Solutions", "CMS Development"],
      link: "/solutions/website-development"
    },
    {
      icon: <Bot className="w-16 h-16 text-primary" />,
      title: "AI Agents",
      description: "Revolutionary AI-powered agents that enhance productivity and provide intelligent solutions.",
      features: ["Conversational AI", "Task Automation", "Decision Support", "Machine Learning"],
      link: "/solutions/ai-agents"
    }
  ];

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      {/* Hero Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">Our Solutions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive technology solutions designed to propel your business into the future
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="card-glass hover:shadow-glow transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-4 rounded-lg bg-primary/10">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-lg">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">Key Features:</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to={service.link}>
                    <Button className="w-full group">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
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
              <h2 className="text-3xl font-bold mb-4 text-glow">Ready to Transform Your Business?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's discuss how our solutions can help you achieve your goals and stay ahead of the competition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="glow-effect">
                    Get Started Today
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-primary/50 hover:border-primary">
                  Schedule Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Solutions;