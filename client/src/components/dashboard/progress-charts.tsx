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
  AreaChart,
  Legend
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = "week" | "month" | "year";
type RunType = "all" | "easy" | "tempo" | "long" | "interval";

interface ChartData {
  name: string;
  value: number;
  date?: string;
  runType?: string;
}

// Map run types to display names and colors
const runTypeConfig = {
  easy: { name: "Easy Runs", color: "hsl(var(--primary))" },
  tempo: { name: "Tempo Runs", color: "hsl(var(--secondary))" },
  long: { name: "Long Runs", color: "hsl(var(--accent))" },
  interval: { name: "Interval Training", color: "hsl(var(--destructive))" }
};

export function ProgressCharts() {
  const [distanceTimeRange, setDistanceTimeRange] = useState<TimeRange>("week");
  const [paceTimeRange, setPaceTimeRange] = useState<TimeRange>("week");
  const [selectedRunType, setSelectedRunType] = useState<RunType>("all");

  const { data: distanceData } = useQuery<ChartData[]>({
    queryKey: ["/api/charts/distance", distanceTimeRange],
  });

  const { data: paceData } = useQuery<ChartData[]>({
    queryKey: ["/api/charts/pace", paceTimeRange, selectedRunType],
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
    { name: "Week 1", value: 9.5, runType: "easy" },
    { name: "Week 2", value: 9.3, runType: "easy" },
    { name: "Week 2", value: 8.5, runType: "tempo" },
    { name: "Week 3", value: 9.0, runType: "easy" },
    { name: "Week 3", value: 8.3, runType: "tempo" },
    { name: "Week 4", value: 8.8, runType: "easy" },
    { name: "Week 4", value: 8.1, runType: "tempo" },
    { name: "Week 5", value: 8.7, runType: "easy" }
  ];

  const displayDistanceData = distanceData || placeholderDistanceData;
  const displayPaceData = paceData || placeholderPaceData;

  // Format data for multi-line chart when showing all run types
  const formatMultiLineData = (data: ChartData[]) => {
    // If we're not showing all run types, just return the data as is
    if (selectedRunType !== 'all') {
      return data;
    }

    // For "all" we need to transform the data to be grouped by time period
    // Group data by time period (name) for the multi-line chart
    const groupedByTime: Record<string, Record<string, number>> = {};
    
    data.forEach(item => {
      if (!groupedByTime[item.name]) {
        groupedByTime[item.name] = {};
      }
      if (item.runType) {
        groupedByTime[item.name][item.runType] = item.value;
      }
    });
    
    // Convert to format needed for Recharts multi-line chart
    return Object.entries(groupedByTime).map(([name, runTypes]) => ({
      name,
      ...runTypes
    }));
  };

  const multiLineData = formatMultiLineData(displayPaceData);

  // Determine min and max for y-axis
  const paceValues = displayPaceData.map(item => item.value);
  const minPace = Math.floor(Math.min(...paceValues)) - 0.5;
  const maxPace = Math.ceil(Math.max(...paceValues)) + 0.5;

  // Format pace for display (convert decimal to MM:SS)
  const formatPace = (value: number) => {
    const minutes = Math.floor(value);
    const seconds = Math.round((value % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-neutral-medium">Group by run type:</div>
          <Select value={selectedRunType} onValueChange={(value) => setSelectedRunType(value as RunType)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Run Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Run Types</SelectItem>
              <SelectItem value="easy">Easy Runs</SelectItem>
              <SelectItem value="tempo">Tempo Runs</SelectItem>
              <SelectItem value="long">Long Runs</SelectItem>
              <SelectItem value="interval">Interval Training</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="chart-container mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {selectedRunType === 'all' ? (
              // Multi-line chart for "all" run types
              <LineChart data={multiLineData}>
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
                  domain={[minPace, maxPace]}
                  tickFormatter={(value) => formatPace(value)}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    return [`${formatPace(value as number)} min/mile`, runTypeConfig[name as keyof typeof runTypeConfig]?.name || name];
                  }}
                />
                <Legend />
                {Object.entries(runTypeConfig).map(([type, config]) => (
                  <Line 
                    key={type}
                    type="monotone" 
                    dataKey={type} 
                    name={config.name}
                    stroke={config.color} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            ) : (
              // Single line chart for specific run type
              <AreaChart data={displayPaceData}>
                <defs>
                  <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={runTypeConfig[selectedRunType]?.color || "hsl(var(--secondary))"} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={runTypeConfig[selectedRunType]?.color || "hsl(var(--secondary))"} stopOpacity={0}/>
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
                  domain={[minPace, maxPace]}
                  tickFormatter={(value) => formatPace(value)}
                />
                <Tooltip 
                  formatter={(value) => [`${formatPace(value as number)} min/mile`, runTypeConfig[selectedRunType]?.name || "Pace"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={runTypeConfig[selectedRunType]?.color || "hsl(var(--secondary))"} 
                  fillOpacity={1} 
                  fill="url(#colorPace)" 
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
