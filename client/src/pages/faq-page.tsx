import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { useEffect } from "react";
import { AppLayout } from "@/components/common/app-layout";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactValues = z.infer<typeof contactSchema>;

export default function FAQPage() {
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const contactForm = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  const onContactSubmit = async (values: ContactValues) => {
    // Create mailto link for direct email
    const subject = encodeURIComponent(values.subject);
    const body = encodeURIComponent(`Name: ${values.name}\nEmail: ${values.email}\n\nMessage:\n${values.message}`);
    const mailtoLink = `mailto:support@aetherrun.com?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Email client opened",
      description: "Your default email client should open with the message pre-filled."
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">Frequently Asked Questions</h1>
          <p className="text-xl text-white/80 drop-shadow-md">Find answers to common questions about CatholicRun</p>
        </div>
        
        <Accordion type="single" collapsible className="w-full mb-12 space-y-4">
          <AccordionItem value="item-1" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">What is CatholicRun?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              CatholicRun is an AI-powered fitness platform that provides personalized training plans, nutrition advice, and health analytics for runners and athletes. Our platform integrates with various fitness trackers and uses advanced AI to help you achieve your fitness goals.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">How does CatholicRun generate training plans?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              CatholicRun uses advanced AI technology powered by OpenAI to create personalized training plans based on your fitness level, goals, available time, and health metrics. The system analyzes your recent activities, recovery status, and adapts plans as you progress.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">What fitness trackers can I connect to AetherRun?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              AetherRun integrates with multiple fitness platforms including Strava, Garmin Connect, Polar, Google Fit, WHOOP, Apple Health, and Fitbit. You can connect these platforms in your profile settings to automatically import your activities and health metrics.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">What's included in the free plan?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              The free plan includes basic activity tracking, goal setting, and simplified training recommendations. You can track your runs, view basic statistics, and set fitness goals. For advanced features like AI-generated training plans, personalized nutrition advice, and premium analytics, you'll need a subscription.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">What's the difference between monthly and annual subscriptions?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              Both monthly and premium subscriptions include AI-generated training plans, advanced analytics, and nutrition recommendations. Annual subscriptions provide additional premium features including access to professional coaches, video analysis, early access to new features, and priority support.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">How does the coaching feature work?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              With an annual subscription, you get access to professional running coaches who can provide personalized guidance. You can select a coach from our marketplace, book sessions, and communicate with them directly through the platform. Coaches can also customize your AI-generated training plans.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-7" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">How does AetherRun handle my health and fitness data?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              AetherRun takes your privacy seriously. We only collect the data necessary to provide our services, and we never share your personal data with third parties without your explicit consent. You can revoke access to connected fitness platforms at any time in your profile settings.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-8" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">How do I cancel my subscription?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              You can cancel your subscription at any time through your account settings. If you cancel, you'll continue to have access to premium features until the end of your current billing period. We don't offer refunds for partial subscription periods.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-9" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">What is the Recovery Readiness Score?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              The Recovery Readiness Score is a daily metric that evaluates your body's readiness for training. It combines several factors including Heart Rate Variability (HRV), resting heart rate, sleep quality, and previous day's activity. A higher score indicates better recovery and readiness for more intense training.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-10" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-6 py-2">
            <AccordionTrigger className="text-white hover:text-cyan-300 transition-colors">How accurate are the AI-generated recommendations?</AccordionTrigger>
            <AccordionContent className="text-white/80 pt-4">
              Our AI-powered recommendations are based on state-of-the-art machine learning models and sports science principles. While they are highly accurate and personalized, they should be used as guidance rather than absolute instructions. Always listen to your body and adjust as needed. Premium users can get human coach oversight for the ultimate personalization.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Contact Form */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white drop-shadow-sm">
              <Mail className="w-5 h-5" />
              Contact Support
            </CardTitle>
            <CardDescription className="text-white/70 drop-shadow-sm">
              Can't find the answer you're looking for? Send us a message and we'll get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...contactForm}>
              <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={contactForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white drop-shadow-sm">Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your full name" 
                            className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white drop-shadow-sm">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your.email@example.com" 
                            className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={contactForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white drop-shadow-sm">Subject</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of your inquiry" 
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white drop-shadow-sm">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe your question or issue in detail..."
                          className="min-h-[120px] bg-white/10 border-white/30 text-white placeholder:text-white/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}