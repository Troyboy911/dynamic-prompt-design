import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Zap, Globe, Sparkles, X } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const navigate = useNavigate();

  const handleStartTrial = () => {
    onOpenChange(false);
    navigate('/auth?trial=true&returnTo=/marketplace');
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate('/auth?returnTo=/marketplace');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Set a flag to not show again this session
    sessionStorage.setItem('authModalDismissed', 'true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl">
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 w-fit">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            🎉 Exclusive Launch Offer!
          </DialogTitle>
          <DialogDescription className="text-base">
            Get <span className="text-primary font-semibold">30 days FREE</span> access to our Pro automation tools
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Premium Automations</p>
                <p className="text-xs text-muted-foreground">AI-powered workflow tools</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Globe className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Pro Web Scrapers</p>
                <p className="text-xs text-muted-foreground">Extract data from any source</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Priority Support</p>
                <p className="text-xs text-muted-foreground">Get help when you need it</p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <span className="line-through">$79.99/month</span>
            <span className="ml-2 text-primary font-bold">FREE for 30 days</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleStartTrial}
            className="w-full glow-effect text-lg py-6"
            size="lg"
          >
            <Gift className="w-5 h-5 mr-2" />
            Start My Free Trial
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSignIn}
            className="w-full"
          >
            Already have an account? Sign In
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          No credit card required. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
