import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Palette, Search, Smartphone, Code2, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const WebsiteDevelopment = () => {
  const features = [
    {
      icon: <Palette className="w-8 h-8 text-primary" />,
      title: "Custom Design",
      description: "Unique designs that reflect your brand and captivate your audience"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-primary" />,
      title: "Responsive Layout",
      description: "Perfect performance across all devices and screen sizes"
    },
    {
      icon: <Search className="w-8 h-8 text-primary" />,
      title: "SEO Optimized",
      description: "Built-in SEO best practices to improve search rankings"
    },
    {
      icon: <Rocket className="w-8 h-8 text-primary" />,
      title: "Fast Performance",
      description: "Lightning-fast loading times for optimal user experience"
    }
  ];

  const technologies = [
    "React", "Next.js", "TypeScript", "Tailwind CSS", 
    "Node.js", "WordPress", "Shopify", "Webflow",
    "HTML5", "CSS3", "JavaScript", "PHP"
  ];

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      {/* Hero Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/10">
              <Globe className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">Website Development</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Modern, responsive websites that not only look stunning but also deliver 
            exceptional performance and drive meaningful business results.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Why Choose Our Web Development?</h2>
            <p className="text-lg text-muted-foreground">
              We create websites that combine beautiful design with powerful functionality.
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
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <Code2 className="w-8 h-8 text-primary" />
                Technologies We Master
              </CardTitle>
              <CardDescription>
                We use the latest web technologies to build fast, secure, and scalable websites.
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

      {/* Website Types Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Website Types We Create</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Business Websites", desc: "Professional corporate websites that establish credibility and showcase your services" },
              { title: "E-commerce Stores", desc: "Full-featured online stores with payment processing and inventory management" },
              { title: "Portfolio Sites", desc: "Stunning portfolio websites that showcase your work and attract new clients" },
              { title: "Landing Pages", desc: "High-converting landing pages optimized for specific campaigns and goals" },
              { title: "Blogs & Content Sites", desc: "Content management systems perfect for blogging and content marketing" },
              { title: "Custom Web Apps", desc: "Complex web applications with advanced functionality and integrations" }
            ].map((type, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-primary">{type.title}</h3>
                  <p className="text-muted-foreground text-sm">{type.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-glow">Our Development Process</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Strategy", desc: "Planning and wireframing" },
              { step: "02", title: "Design", desc: "Visual design and prototyping" },
              { step: "03", title: "Development", desc: "Coding and implementation" },
              { step: "04", title: "Launch", desc: "Testing and deployment" }
            ].map((phase, index) => (
              <Card key={index} className="card-glass text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-3">{phase.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{phase.title}</h3>
                  <p className="text-muted-foreground text-sm">{phase.desc}</p>
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
              <h2 className="text-3xl font-bold mb-4 text-glow">Ready to Build Your Website?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's create a website that represents your brand and drives real business results.
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

export default WebsiteDevelopment;