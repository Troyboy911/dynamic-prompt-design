import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import FeaturedProducts from "@/components/FeaturedProducts";
import About from "@/components/About";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const checkAuthAndShowModal = async () => {
      const dismissed = sessionStorage.getItem('authModalDismissed');
      if (dismissed) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const timer = setTimeout(() => {
          setShowAuthModal(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    checkAuthAndShowModal();
  }, []);

  return (
    <div className="min-h-screen hero-bg">
      <SEOHead
        title="AI Agents, Automation & App Development"
        description="Transform your business with Stellarc Dynamics. We deliver cutting-edge AI agents like Dominus, intelligent automation, custom app development, and modern websites. Start your 7-day free trial today."
        keywords="AI agents, Dominus AI, automation, app development, web development, artificial intelligence, business automation, digital transformation"
        canonicalPath="/"
      />
      <Navigation />
      <Hero />
      <Services />
      <FeaturedProducts />
      <About />
      <Footer />
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;
