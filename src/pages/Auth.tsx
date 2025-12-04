import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Gift, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const returnTo = new URLSearchParams(location.search).get('returnTo') || '/marketplace';
  const showFreeTrial = new URLSearchParams(location.search).get('trial') === 'true';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate(returnTo);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(returnTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${returnTo}`,
          data: {
            free_trial: showFreeTrial,
          }
        },
      });

      if (error) throw error;

      // Trigger welcome email via edge function
      if (data.user) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              userId: data.user.id,
              email: data.user.email,
              fullName: data.user.user_metadata?.full_name || '',
            },
          });
          
          if (emailError) {
            console.error('Welcome email error:', emailError);
          }
        } catch (emailErr) {
          console.error('Failed to send welcome email:', emailErr);
        }
      }

      toast({
        title: showFreeTrial ? "🎉 Free Trial Activated!" : "Account Created!",
        description: showFreeTrial 
          ? "Welcome! You now have 7 days free access to our featured automation tools. Check your email for details!"
          : "Your account has been created. Check your email to verify.",
      });
      
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        toast({
          title: "Account Exists",
          description: "This email is already registered. Try signing in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup Failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      <div className="flex items-center justify-center p-6 pt-32 pb-20">
        <Card className="w-full max-w-md card-glass">
          <CardHeader className="text-center">
            {showFreeTrial && (
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-4 mb-4 border border-primary/30">
                <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-primary">
                  🎁 Get 7 Days FREE Access
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign up now and unlock featured automations & scrapers
                </p>
              </div>
            )}
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Stellarc</CardTitle>
            <CardDescription>
              {showFreeTrial 
                ? "Create your free account to start your trial"
                : "Sign in or create an account to continue"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={showFreeTrial ? "signup" : "login"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full glow-effect" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full glow-effect" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : showFreeTrial ? "Start Free Trial" : "Create Account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {showFreeTrial && (
                    <p className="text-xs text-muted-foreground text-center">
                      No credit card required. Cancel anytime.
                    </p>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
