import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import heroImage from "@/assets/stellarc-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-glow">
          STELLARC
          <span className="block text-primary">DYNAMICS</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto">
          Pioneering the future through innovative apps, intelligent automations, 
          and cutting-edge AI agents that transform how businesses operate.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/marketplace">
            <Button size="lg" className="glow-effect text-lg px-8 py-6">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
          <Link to="/solutions">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-primary/50 hover:border-primary">
              Explore Solutions
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            7-Day Free Trial
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            No Credit Card Required
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
