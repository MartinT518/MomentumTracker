import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { BarChart3, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityData {
  id: number;
  date: string;
  type: {
    name: string;
    icon: "chart" | "speed" | "activity";
    color: "primary" | "secondary" | "accent";
  };
  distance: string;
  time: string;
  pace: string;
  heartRate: string;
  effort: {
    level: "easy" | "moderate" | "hard";
    label: string;
  };
}

export function RecentActivities() {
  const [location, navigate] = useLocation();
  const [viewActivityId, setViewActivityId] = useState<number | null>(null);
  const [viewActivityOpen, setViewActivityOpen] = useState(false);
  
  const { data, isLoading } = useQuery<ActivityData[]>({
    queryKey: ["/api/activities/recent"],
  });
  
  const handleViewActivity = (activityId: number) => {
    setViewActivityId(activityId);
    setViewActivityOpen(true);
  };

  // Placeholder data for the UI
  const placeholderActivities = [
    {
      id: 1,
      date: "Jul 30, 2023",
      type: {
        name: "Long Run",
        icon: "chart",
        color: "secondary"
      },
      distance: "12.6 mi",
      time: "1:51:24",
      pace: "8:51 /mi",
      heartRate: "152 bpm",
      effort: {
        level: "moderate",
        label: "Moderate"
      }
    },
    {
      id: 2,
      date: "Jul 28, 2023",
      type: {
        name: "Tempo Run",
        icon: "speed",
        color: "primary"
      },
      distance: "6.2 mi",
      time: "48:36",
      pace: "7:50 /mi",
      heartRate: "165 bpm",
      effort: {
        level: "hard",
        label: "Hard"
      }
    },
    {
      id: 3,
      date: "Jul 26, 2023",
      type: {
        name: "Easy Run",
        icon: "activity",
        color: "accent"
      },
      distance: "5.0 mi",
      time: "47:15",
      pace: "9:27 /mi",
      heartRate: "139 bpm",
      effort: {
        level: "easy",
        label: "Easy"
      }
    }
  ];

  const activities = data || placeholderActivities;

  const getIconComponent = (icon: string, color: string) => {
    const colorClass = color === "primary" ? "text-blue-300" : 
                      color === "secondary" ? "text-purple-300" : 
                      color === "accent" ? "text-green-300" : "text-white/70";
    switch (icon) {
      case "chart":
        return <BarChart3 className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
      case "speed":
        return <Zap className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
      case "activity":
        return <Activity className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
      default:
        return <Activity className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
    }
  };

  const getEffortBadgeClass = (level: string) => {
    switch (level) {
      case "easy":
        return "text-green-200 border border-green-300/30";
      case "moderate":
        return "text-blue-200 border border-blue-300/30";
      case "hard":
        return "text-red-200 border border-red-300/30";
      default:
        return "text-white/80 border border-white/30";
    }
  };

  const getBackgroundClass = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-blue-400/20";
      case "secondary":
        return "bg-purple-400/20";
      case "accent":
        return "bg-green-400/20";
      default:
        return "bg-white/20";
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/20">
          <thead className="bg-white/5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Activity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Distance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Pace</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Heart Rate</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Effort</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white/80 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white/5 divide-y divide-white/10">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-white/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md">{activity.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={cn(
                      "rounded-md p-1 mr-2 bg-white/20",
                      getBackgroundClass(activity.type.color)
                    )}>
                      {getIconComponent(activity.type.icon, activity.type.color)}
                    </div>
                    <span className="text-sm font-medium text-white drop-shadow-md">{activity.type.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{activity.distance}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{activity.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{activity.pace}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{activity.heartRate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/20 backdrop-blur-sm",
                    getEffortBadgeClass(activity.effort.level)
                  )}>
                    {activity.effort.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleViewActivity(activity.id)}
                    className="text-white/90 hover:text-white drop-shadow-md cursor-pointer bg-transparent border-none p-0 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Activity Detail View Dialog */}
      <Dialog open={viewActivityOpen} onOpenChange={setViewActivityOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              View detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          
          {viewActivityId && activities.find(a => a.id === viewActivityId) && (
            <div className="py-4">
              {(() => {
                const activity = activities.find(a => a.id === viewActivityId)!;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={cn(
                          "rounded-md p-1.5 mr-2",
                          getBackgroundClass(activity.type.color)
                        )}>
                          {getIconComponent(activity.type.icon, activity.type.color)}
                        </div>
                        <h3 className="text-lg font-semibold">{activity.type.name}</h3>
                      </div>
                      <span className="text-muted-foreground">{activity.date}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Distance</div>
                          <div className="text-xl font-semibold">{activity.distance}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Time</div>
                          <div className="text-xl font-semibold">{activity.time}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Pace</div>
                          <div className="text-xl font-semibold">{activity.pace}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Heart Rate</div>
                          <div className="text-xl font-semibold">{activity.heartRate}</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Effort Level</div>
                        <span className={cn(
                          "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                          getEffortBadgeClass(activity.effort.level)
                        )}>
                          {activity.effort.label}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Training Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {activity.type.name === "Long Run" ? 
                          "This long run was designed to build endurance and practice pacing strategy. The goal was maintaining a consistent effort throughout the entire duration." :
                          activity.type.name === "Tempo Run" ?
                          "This tempo run was designed to improve lactate threshold and mental fortitude. The primary goal was sustaining a challenging but manageable pace." :
                          "This easy run was designed for recovery and active rest. The goal was to keep heart rate low while maintaining good form."}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewActivityOpen(false)}>Close</Button>
            <Button variant="outline" onClick={() => navigate('/activities')}>View All Activities</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
