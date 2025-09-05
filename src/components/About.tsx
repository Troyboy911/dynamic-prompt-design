import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="card-glass">
          <CardContent className="p-12">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-glow">About Stellarc Dynamics</h2>
              
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  At Stellarc Dynamics, we're not just building technology – we're crafting the future. 
                  As a forward-thinking startup, we specialize in creating innovative solutions that bridge 
                  the gap between imagination and reality.
                </p>
                
                <p>
                  Our expertise spans across custom application development, intelligent automation systems, 
                  modern website creation, and groundbreaking AI agent technology. We believe in the power 
                  of technology to transform businesses and enhance human potential.
                </p>
                
                <p>
                  From concept to deployment, we work closely with our clients to deliver solutions that 
                  aren't just functional, but revolutionary. Every project is an opportunity to push 
                  boundaries and set new standards in the industry.
                </p>
                
                <div className="pt-8">
                  <div className="text-primary font-semibold text-xl">
                    "Innovation is our compass, excellence is our destination."
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default About;