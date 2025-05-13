import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Activity, 
  Heart, 
  TrendingUp,
  BarChart,
  ArrowRight
} from "lucide-react";
import { User } from "@shared/schema";

type WelcomeStepProps = {
  onNext: () => void;
  user: User;
};

export default function WelcomeStep({ onNext, user }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <h1 className="text-3xl font-bold mb-2">Welcome to MomentumRun, {user.first_name || user.username}!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Let's set up your personalized experience to help you achieve your fitness goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-4">
        <FeatureCard 
          icon={<Trophy className="h-8 w-8 text-amber-500" />}
          title="Personal Goals"
          description="Set achievable fitness goals tailored to your needs and track your progress over time."
        />
        <FeatureCard 
          icon={<Activity className="h-8 w-8 text-blue-500" />}
          title="Training Plans"
          description="Get AI-powered training plans optimized for your fitness level and goals."
        />
        <FeatureCard 
          icon={<Heart className="h-8 w-8 text-red-500" />}
          title="Health Tracking"
          description="Monitor your vital metrics and see how your body responds to training."
        />
        <FeatureCard 
          icon={<TrendingUp className="h-8 w-8 text-green-500" />}
          title="Progress Analysis"
          description="Visualize your improvement with detailed charts and performance insights."
        />
        <FeatureCard 
          icon={<BarChart className="h-8 w-8 text-purple-500" />}
          title="Energy Management"
          description="Track your energy levels and optimize your training based on recovery status."
        />
        <FeatureCard 
          icon={<Heart className="h-8 w-8 text-pink-500" />}
          title="Holistic Approach"
          description="Balance training, nutrition, recovery, and mental aspects for overall fitness."
        />
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onNext}>
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-2">
        {icon}
        <h3 className="text-lg font-medium ml-2">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}