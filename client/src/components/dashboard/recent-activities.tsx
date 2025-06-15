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
  activity_date?: string;
  date?: string;
  activity_type: string;
  distance?: number | string;
  duration?: number | string;
  time?: string;
  pace?: string;
  heart_rate?: number | string;
  heartRate?: string;
  calories?: number;
  effort?: {
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

  const getActivityIcon = (activityType: string) => {
    const type = activityType?.toLowerCase() || 'run';
    const colorClass = "text-blue-300"; // Default color for all activities
    
    if (type.includes('run')) {
      return <Activity className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
    } else if (type.includes('bike') || type.includes('cycle')) {
      return <Zap className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
    } else if (type.includes('swim')) {
      return <BarChart3 className={`h-4 w-4 ${colorClass} drop-shadow-md`} />;
    } else {
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
            {activities.map((activity) => {
              // Handle different data structures safely
              const isRealActivity = 'activity_type' in activity;
              const displayDate = isRealActivity ? activity.activity_date : activity.date;
              const displayDistance = isRealActivity ? 
                (activity.distance ? `${activity.distance} mi` : 'N/A') : 
                activity.distance;
              const displayTime = isRealActivity ? 
                (activity.duration ? `${Math.floor(Number(activity.duration) / 60)}:${String(Number(activity.duration) % 60).padStart(2, '0')}` : 'N/A') : 
                activity.time;
              const displayPace = isRealActivity ? (activity.pace || 'N/A') : activity.pace;
              const displayHeartRate = isRealActivity ? 
                (activity.heart_rate ? `${activity.heart_rate} bpm` : 'N/A') : 
                activity.heartRate;
              const activityType = isRealActivity ? activity.activity_type : activity.type?.name;
              
              return (
                <tr key={activity.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md">{displayDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="rounded-md p-1 mr-2 bg-white/20 bg-blue-400/20">
                        {isRealActivity ? getActivityIcon(activity.activity_type) : getActivityIcon(activity.type?.name || 'run')}
                      </div>
                      <span className="text-sm font-medium text-white drop-shadow-md">{activityType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{displayDistance}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{displayTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{displayPace}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white drop-shadow-md metric-value">{displayHeartRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/20 backdrop-blur-sm",
                      getEffortBadgeClass(isRealActivity ? (activity.effort?.level || 'easy') : activity.effort?.level || 'easy')
                    )}>
                      {isRealActivity ? (activity.effort?.label || 'Easy') : activity.effort?.label || 'Easy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewActivity(activity.id)}
                      className="text-white/90 hover:text-white drop-shadow-md cursor-pointer bg-transparent border-none p-0 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
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
                const isRealActivity = 'activity_type' in activity;
                const displayDate = isRealActivity ? activity.activity_date : activity.date;
                const displayDistance = isRealActivity ? 
                  (activity.distance ? `${activity.distance} mi` : 'N/A') : 
                  activity.distance;
                const displayTime = isRealActivity ? 
                  (activity.duration ? `${Math.floor(Number(activity.duration) / 60)}:${String(Number(activity.duration) % 60).padStart(2, '0')}` : 'N/A') : 
                  activity.time;
                const displayPace = isRealActivity ? (activity.pace || 'N/A') : activity.pace;
                const displayHeartRate = isRealActivity ? 
                  (activity.heart_rate ? `${activity.heart_rate} bpm` : 'N/A') : 
                  activity.heartRate;
                const activityType = isRealActivity ? activity.activity_type : activity.type?.name;
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="rounded-md p-1.5 mr-2 bg-blue-400/20">
                          {isRealActivity ? getActivityIcon(activity.activity_type) : getActivityIcon(activity.type?.name || 'run')}
                        </div>
                        <h3 className="text-lg font-semibold">{activityType}</h3>
                      </div>
                      <span className="text-muted-foreground">{displayDate}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Distance</div>
                          <div className="text-xl font-semibold">{displayDistance}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Time</div>
                          <div className="text-xl font-semibold">{displayTime}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Pace</div>
                          <div className="text-xl font-semibold">{displayPace}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Heart Rate</div>
                          <div className="text-xl font-semibold">{displayHeartRate}</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Effort Level</div>
                        <span className={cn(
                          "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                          getEffortBadgeClass(isRealActivity ? (activity.effort?.level || 'easy') : activity.effort?.level || 'easy')
                        )}>
                          {isRealActivity ? (activity.effort?.label || 'Easy') : activity.effort?.label || 'Easy'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Training Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        Activity completed successfully. View detailed metrics above.
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
