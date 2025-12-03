import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Send, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const reviews = [
  {
    name: "Sarah Mitchell",
    company: "TechFlow Solutions",
    rating: 5,
    review: "Stellarc Dynamics transformed our entire workflow with their custom automation solutions. We've saved over 40 hours per week on repetitive tasks. Absolutely game-changing!",
    avatar: "SM"
  },
  {
    name: "James Rodriguez",
    company: "DataPulse Analytics",
    rating: 5,
    review: "The AI agents they built for us handle customer inquiries 24/7 with incredible accuracy. Our response time dropped from hours to seconds. Highly recommend their team!",
    avatar: "JR"
  },
  {
    name: "Emily Chen",
    company: "GrowthStack Marketing",
    rating: 5,
    review: "Their web scraping tools are phenomenal. We now have real-time competitive intelligence that used to take days to gather manually. Worth every penny.",
    avatar: "EC"
  },
  {
    name: "Michael Thompson",
    company: "Nexus Retail Group",
    rating: 5,
    review: "From concept to deployment in just 3 weeks. The app they developed for our inventory management exceeded all expectations. Professional, responsive, and incredibly skilled.",
    avatar: "MT"
  },
  {
    name: "Amanda Foster",
    company: "Bright Horizons Consulting",
    rating: 5,
    review: "We've worked with many tech vendors, but Stellarc stands out. Their attention to detail and commitment to our success made all the difference. True partners!",
    avatar: "AF"
  },
  {
    name: "David Park",
    company: "Velocity Logistics",
    rating: 5,
    review: "The automation pipeline they created reduced our processing errors by 95%. Our team can finally focus on strategic work instead of data entry. Fantastic results!",
    avatar: "DP"
  },
  {
    name: "Rachel Bennett",
    company: "Innovate Health Systems",
    rating: 5,
    review: "Exceptional service from start to finish. They understood our complex requirements and delivered a solution that perfectly fits our needs. Already planning our next project together.",
    avatar: "RB"
  }
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen hero-bg">
      <SEOHead
        title="Contact Us"
        description="Get in touch with Stellarc Dynamics. We're ready to transform your business with cutting-edge AI agents, automation, and custom software solutions. Contact us today for a free consultation."
        keywords="contact Stellarc Dynamics, AI consulting, automation services, software development quote, business consultation"
        canonicalPath="/contact"
      />
      <Navigation />
      {/* Header */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-glow">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to transform your business with cutting-edge technology? Let's start the conversation.
          </p>
        </div>
      </div>

      {/* Contact Form & Info */}
      <div className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full glow-effect">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="card-glass h-fit">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-primary">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-muted-foreground">contact@stellarcdynamics.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-muted-foreground">Remote & Worldwide</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our clients have to say about working with Stellarc Dynamics.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="card-glass hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">"{review.review}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;