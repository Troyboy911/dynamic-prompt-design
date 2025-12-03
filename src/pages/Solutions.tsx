import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Cpu, Globe, Bot, ArrowRight, CheckCircle, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

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
    },
    {
      icon: <MessageSquare className="w-16 h-16 text-primary" />,
      title: "Dominus",
      description: "Your intelligent customer support assistant powered by advanced AI. Provides instant, accurate responses 24/7.",
      features: ["24/7 Customer Support", "Natural Conversations", "Instant Responses", "Customizable Personality"],
      link: "/contact"
    },
    {
      icon: <Sparkles className="w-16 h-16 text-muted-foreground" />,
      title: "Dominus Prime",
      description: "The next evolution in AI assistance. Enhanced reasoning, multi-modal capabilities, and enterprise-grade intelligence.",
      features: ["Advanced Reasoning", "Multi-Modal Support", "Enterprise Integration", "Autonomous Workflows"],
      link: null,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen hero-bg">
      <SEOHead
        title="Solutions - AI Agents, Automation, App & Web Development"
        description="Explore Stellarc Dynamics solutions: Dominus AI assistant, intelligent automation, custom app development, and modern website creation. Transform your business with cutting-edge technology."
        keywords="AI solutions, Dominus AI, business automation, app development, web development, AI agents, Dominus Prime, digital transformation"
        canonicalPath="/solutions"
      />
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
              <Card key={index} className={`card-glass hover:shadow-glow transition-all duration-300 ${service.comingSoon ? 'opacity-80' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-4 rounded-lg ${service.comingSoon ? 'bg-muted/20' : 'bg-primary/10'}`}>
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                        {service.comingSoon && (
                          <span className="px-3 py-1 text-xs font-semibold bg-primary/20 text-primary rounded-full animate-pulse">
                            Coming Soon
                          </span>
                        )}
                      </div>
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
                          <CheckCircle className={`w-4 h-4 ${service.comingSoon ? 'text-muted-foreground' : 'text-primary'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {service.link ? (
                    <Link to={service.link}>
                      <Button className="w-full group">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full opacity-50 cursor-not-allowed">
                      Coming Soon
                    </Button>
                  )}
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