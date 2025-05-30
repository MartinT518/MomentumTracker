import { useQuery } from "@tanstack/react-query";
import { BarChart3, Timer, ArrowUp } from "lucide-react";

interface WeeklyMetricsData {
  distance: {
    value: number;
    unit: string;
    change: number;
  };
  pace: {
    value: string;
    unit: string;
    change: string;
  };
  activeTime: {
    value: string;
    unit: string;
    change: string;
  };
}

export function WeeklyMetrics() {
  const { data, isLoading } = useQuery<WeeklyMetricsData>({
    queryKey: ["/api/metrics/weekly"],
  });

  // Placeholder data for the UI
  const placeholderData = {
    distance: {
      value: 32.4,
      unit: "miles",
      change: 12
    },
    pace: {
      value: "8:42",
      unit: "min/mile",
      change: "0:18 faster"
    },
    activeTime: {
      value: "4:51",
      unit: "hours",
      change: "42 minutes more"
    }
  };

  const metricsData = data || placeholderData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
      {/* Weekly Distance Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 flex items-center shadow-xl hover:bg-white/15 transition-all duration-300">
        <div className="rounded-full bg-white/20 backdrop-blur-sm p-3 mr-4 border border-white/30">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-white/70 text-sm">Weekly Distance</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-white drop-shadow-lg">{metricsData.distance.value}</span>
            <span className="ml-1 text-white/80 text-sm">{metricsData.distance.unit}</span>
          </div>
          <p className="text-xs text-green-300 flex items-center mt-1">
            <ArrowUp className="h-3 w-3 mr-1" />
            {metricsData.distance.change}% from last week
          </p>
        </div>
      </div>
      
      {/* Average Pace Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 flex items-center shadow-xl hover:bg-white/15 transition-all duration-300">
        <div className="rounded-full bg-white/20 backdrop-blur-sm p-3 mr-4 border border-white/30">
          <Timer className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-white/70 text-sm">Average Pace</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-white drop-shadow-lg">{metricsData.pace.value}</span>
            <span className="ml-1 text-white/80 text-sm">{metricsData.pace.unit}</span>
          </div>
          <p className="text-xs text-green-300 flex items-center mt-1">
            <ArrowUp className="h-3 w-3 mr-1" />
            {metricsData.pace.change} than last week
          </p>
        </div>
      </div>
      
      {/* Active Time Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 flex items-center shadow-xl hover:bg-white/15 transition-all duration-300">
        <div className="rounded-full bg-white/20 backdrop-blur-sm p-3 mr-4 border border-white/30">
          <Timer className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-white/70 text-sm">Active Time</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-white drop-shadow-lg">{metricsData.activeTime.value}</span>
            <span className="ml-1 text-white/80 text-sm">{metricsData.activeTime.unit}</span>
          </div>
          <p className="text-xs text-green-300 flex items-center mt-1">
            <ArrowUp className="h-3 w-3 mr-1" />
            {metricsData.activeTime.change} than last week
          </p>
        </div>
      </div>
    </div>
  );
}
