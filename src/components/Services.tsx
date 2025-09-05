import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Cpu, Globe, Bot } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: <Smartphone className="w-12 h-12 text-primary" />,
      title: "App Development",
      description: "Custom mobile and web applications built with cutting-edge technology and user-centric design."
    },
    {
      icon: <Cpu className="w-12 h-12 text-primary" />,
      title: "Automation Solutions",
      description: "Streamline your business processes with intelligent automation systems that save time and reduce errors."
    },
    {
      icon: <Globe className="w-12 h-12 text-primary" />,
      title: "Website Development",
      description: "Modern, responsive websites that captivate audiences and drive business growth."
    },
    {
      icon: <Bot className="w-12 h-12 text-primary" />,
      title: "AI Agents",
      description: "Revolutionary AI-powered agents that enhance productivity and provide intelligent solutions for complex challenges."
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-glow">Our Solutions</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We deliver comprehensive technology solutions that propel your business into the future
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="card-glass hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {service.icon}
                </div>
                <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;