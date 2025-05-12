import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart 
} from "recharts";

type TimeRange = "week" | "month" | "year";

interface ChartData {
  name: string;
  value: number;
}

export function ProgressCharts() {
  const [distanceTimeRange, setDistanceTimeRange] = useState<TimeRange>("week");
  const [paceTimeRange, setPaceTimeRange] = useState<TimeRange>("week");

  const { data: distanceData } = useQuery<ChartData[]>({
    queryKey: ["/api/charts/distance", distanceTimeRange],
  });

  const { data: paceData } = useQuery<ChartData[]>({
    queryKey: ["/api/charts/pace", paceTimeRange],
  });

  // Placeholder data for the UI
  const placeholderDistanceData = [
    { name: "Mon", value: 3 },
    { name: "Tue", value: 7 },
    { name: "Wed", value: 4.5 },
    { name: "Thu", value: 9 },
    { name: "Fri", value: 7 },
    { name: "Sat", value: 12 },
    { name: "Sun", value: 0 }
  ];

  const placeholderPaceData = [
    { name: "Week 1", value: 9.5 },
    { name: "Week 2", value: 9.3 },
    { name: "Week 3", value: 9.0 },
    { name: "Week 4", value: 8.8 },
    { name: "Week 5", value: 8.7 },
    { name: "Week 6", value: 8.5 }
  ];

  const displayDistanceData = distanceData || placeholderDistanceData;
  const displayPaceData = paceData || placeholderPaceData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Distance Over Time Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold font-heading text-neutral-darker">Distance Progression</h3>
          <div className="flex space-x-2">
            <Button 
              variant={distanceTimeRange === "week" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDistanceTimeRange("week")}
              className="text-xs px-2 py-1 h-auto"
            >
              Week
            </Button>
            <Button 
              variant={distanceTimeRange === "month" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDistanceTimeRange("month")}
              className="text-xs px-2 py-1 h-auto"
            >
              Month
            </Button>
            <Button 
              variant={distanceTimeRange === "year" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setDistanceTimeRange("year")}
              className="text-xs px-2 py-1 h-auto"
            >
              Year
            </Button>
          </div>
        </div>
        
        <div className="chart-container mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayDistanceData}>
              <defs>
                <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: "#757575" }} 
                axisLine={{ stroke: "#e0e0e0" }} 
                tickLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "#757575" }} 
                axisLine={{ stroke: "#e0e0e0" }} 
                tickLine={{ stroke: "#e0e0e0" }}
              />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorDistance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Pace Improvement Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold font-heading text-neutral-darker">Pace Improvement</h3>
          <div className="flex space-x-2">
            <Button 
              variant={paceTimeRange === "week" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setPaceTimeRange("week")}
              className="text-xs px-2 py-1 h-auto"
            >
              Week
            </Button>
            <Button 
              variant={paceTimeRange === "month" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setPaceTimeRange("month")}
              className="text-xs px-2 py-1 h-auto"
            >
              Month
            </Button>
            <Button 
              variant={paceTimeRange === "year" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setPaceTimeRange("year")}
              className="text-xs px-2 py-1 h-auto"
            >
              Year
            </Button>
          </div>
        </div>
        
        <div className="chart-container mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayPaceData}>
              <defs>
                <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: "#757575" }} 
                axisLine={{ stroke: "#e0e0e0" }} 
                tickLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "#757575" }} 
                axisLine={{ stroke: "#e0e0e0" }} 
                tickLine={{ stroke: "#e0e0e0" }}
                domain={[8, 10]}
                tickFormatter={(value) => `${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, '0')}`}
              />
              <Tooltip 
                formatter={(value) => [`${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, '0')} min/mile`, "Pace"]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--secondary))" 
                fillOpacity={1} 
                fill="url(#colorPace)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
