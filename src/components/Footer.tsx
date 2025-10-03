import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">Stellarc Dynamics</h3>
            <p className="text-muted-foreground">
              Pioneering the future through innovative technology solutions and intelligent automation.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:text-primary"
                onClick={() => window.open('https://github.com/stellarcdynamics', '_blank')}
              >
                <Github className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:text-primary"
                onClick={() => window.open('https://linkedin.com/company/stellarcdynamics', '_blank')}
              >
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:text-primary"
                onClick={() => window.open('https://twitter.com/stellarcdynamics', '_blank')}
              >
                <Twitter className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Services</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/solutions/app-development" className="hover:text-primary transition-colors">App Development</Link></li>
              <li><Link to="/solutions/automation" className="hover:text-primary transition-colors">Automation Solutions</Link></li>
              <li><Link to="/solutions/website-development" className="hover:text-primary transition-colors">Website Development</Link></li>
              <li><Link to="/solutions/ai-agents" className="hover:text-primary transition-colors">AI Agents</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contact@stellarcdynamics.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Remote & Worldwide</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/20 mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Stellarc Dynamics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;