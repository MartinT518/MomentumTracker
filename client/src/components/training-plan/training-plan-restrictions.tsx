import React from 'react';
import { Button } from "@/components/ui/button";
import { BrainCircuit, Lock } from "lucide-react";
import { Link } from "wouter";

interface TrainingPlanRestrictionsProps {
  hasExistingPlan: boolean;
  isPremiumUser: boolean;
  onClearPlan?: () => void;
}

export function TrainingPlanRestrictions({ 
  hasExistingPlan, 
  isPremiumUser, 
  onClearPlan 
}: TrainingPlanRestrictionsProps) {
  
  // Show message when user already has a plan
  if (hasExistingPlan) {
    return (
      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BrainCircuit className="h-6 w-6 text-green-400 drop-shadow-md" />
            <div>
              <h2 className="text-xl font-semibold text-white drop-shadow-md">Training Plan Generated</h2>
              <p className="text-white/70 drop-shadow-md">
                You already have a personalized training plan saved to your profile.
              </p>
            </div>
          </div>
          <div className="text-center space-y-4">
            <p className="text-white/80">
              Your AI-generated training plan is ready and automatically saved. 
              You can view it below or generate a new plan if needed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                View Current Plan
              </Button>
              {onClearPlan && (
                <Button 
                  onClick={onClearPlan}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Generate New Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show premium upgrade prompt for free users
  if (!isPremiumUser) {
    return (
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl">
        <div className="p-6 opacity-60">
          <div className="flex items-center space-x-2 mb-6">
            <Lock className="h-6 w-6 text-gray-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-300">AI Training Plan Generator</h2>
              <p className="text-gray-400">
                Premium feature - Upgrade to access personalized training plans
              </p>
            </div>
          </div>
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-400">
              AI-generated training plans are available for premium subscribers only.
            </p>
            <p className="text-gray-500 text-sm">
              Upgrade to unlock personalized training plans, advanced analytics, and more features.
            </p>
            <Link href="/pricing">
              <Button 
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
              >
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If we get here, user can access the generator
  return null;
}