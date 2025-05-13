import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart3, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { data, isLoading } = useQuery<ActivityData[]>({
    queryKey: ["/api/activities/recent"],
  });

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
    const colorClass = `text-${color}`;
    switch (icon) {
      case "chart":
        return <BarChart3 className={`h-4 w-4 ${colorClass}`} />;
      case "speed":
        return <Zap className={`h-4 w-4 ${colorClass}`} />;
      case "activity":
        return <Activity className={`h-4 w-4 ${colorClass}`} />;
      default:
        return <Activity className={`h-4 w-4 ${colorClass}`} />;
    }
  };

  const getEffortBadgeClass = (level: string) => {
    switch (level) {
      case "easy":
        return "bg-accent-light/30 text-accent-dark";
      case "moderate":
        return "bg-primary-light/30 text-primary-dark";
      case "hard":
        return "bg-status-error/20 text-status-error";
      default:
        return "bg-neutral-light/30 text-neutral-dark";
    }
  };

  const getBackgroundClass = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary-light/30";
      case "secondary":
        return "bg-secondary-light/30";
      case "accent":
        return "bg-accent-light/30";
      default:
        return "bg-neutral-light/30";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-neutral-lighter">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Activity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Distance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Pace</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Heart Rate</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Effort</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-medium uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker">{activity.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={cn(
                      "rounded-md p-1 mr-2",
                      getBackgroundClass(activity.type.color)
                    )}>
                      {getIconComponent(activity.type.icon, activity.type.color)}
                    </div>
                    <span className="text-sm font-medium">{activity.type.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker metric-value">{activity.distance}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker metric-value">{activity.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker metric-value">{activity.pace}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-darker metric-value">{activity.heartRate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                    getEffortBadgeClass(activity.effort.level)
                  )}>
                    {activity.effort.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/activities/${activity.id}`} className="text-secondary hover:text-secondary-dark">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
