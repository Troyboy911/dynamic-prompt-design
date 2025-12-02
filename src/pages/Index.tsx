import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import FeaturedProducts from "@/components/FeaturedProducts";
import About from "@/components/About";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";

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
