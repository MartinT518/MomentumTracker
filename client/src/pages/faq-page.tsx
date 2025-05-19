import { Layout } from "@/components/common/layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is AetherRun?</AccordionTrigger>
            <AccordionContent>
              AetherRun is an AI-powered fitness platform that provides personalized training plans, nutrition advice, and health analytics for runners and athletes. Our platform integrates with various fitness trackers and uses advanced AI to help you achieve your fitness goals.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>How does AetherRun generate training plans?</AccordionTrigger>
            <AccordionContent>
              AetherRun uses advanced AI technology powered by OpenAI to create personalized training plans based on your fitness level, goals, available time, and health metrics. The system analyzes your recent activities, recovery status, and adapts plans as you progress.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>What fitness trackers can I connect to AetherRun?</AccordionTrigger>
            <AccordionContent>
              AetherRun integrates with multiple fitness platforms including Strava, Garmin Connect, Polar, Google Fit, WHOOP, Apple Health, and Fitbit. You can connect these platforms in your profile settings to automatically import your activities and health metrics.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>What's included in the free plan?</AccordionTrigger>
            <AccordionContent>
              The free plan includes basic activity tracking, goal setting, and simplified training recommendations. You can track your runs, view basic statistics, and set fitness goals. For advanced features like AI-generated training plans, personalized nutrition advice, and premium analytics, you'll need a subscription.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>What's the difference between monthly and annual subscriptions?</AccordionTrigger>
            <AccordionContent>
              Both monthly and premium subscriptions include AI-generated training plans, advanced analytics, and nutrition recommendations. Annual subscriptions provide additional premium features including access to professional coaches, video analysis, early access to new features, and priority support.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>How does the coaching feature work?</AccordionTrigger>
            <AccordionContent>
              With an annual subscription, you get access to professional running coaches who can provide personalized guidance. You can select a coach from our marketplace, book sessions, and communicate with them directly through the platform. Coaches can also customize your AI-generated training plans.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-7">
            <AccordionTrigger>How does AetherRun handle my health and fitness data?</AccordionTrigger>
            <AccordionContent>
              AetherRun takes your privacy seriously. We only collect the data necessary to provide our services, and we never share your personal data with third parties without your explicit consent. You can revoke access to connected fitness platforms at any time in your profile settings.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-8">
            <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
            <AccordionContent>
              You can cancel your subscription at any time through your account settings. If you cancel, you'll continue to have access to premium features until the end of your current billing period. We don't offer refunds for partial subscription periods.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-9">
            <AccordionTrigger>What is the Recovery Readiness Score?</AccordionTrigger>
            <AccordionContent>
              The Recovery Readiness Score is a daily metric that evaluates your body's readiness for training. It combines several factors including Heart Rate Variability (HRV), resting heart rate, sleep quality, and previous day's activity. A higher score indicates better recovery and readiness for more intense training.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-10">
            <AccordionTrigger>How accurate are the AI-generated recommendations?</AccordionTrigger>
            <AccordionContent>
              Our AI-powered recommendations are based on state-of-the-art machine learning models and sports science principles. While they are highly accurate and personalized, they should be used as guidance rather than absolute instructions. Always listen to your body and adjust as needed. Premium users can get human coach oversight for the ultimate personalization.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Layout>
  );
}