import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Plus, FileUp, RefreshCw, BarChart3, Clock, Navigation, Heart, CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [importActivitiesOpen, setImportActivitiesOpen] = useState(false);
  const [viewActivityId, setViewActivityId] = useState<number | null>(null);
  const [viewActivityOpen, setViewActivityOpen] = useState(false);
  
  // For manual activity entry
  const [activityDate, setActivityDate] = useState<Date | undefined>(new Date());
  const [activityType, setActivityType] = useState("run");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [notes, setNotes] = useState("");
  const [effortLevel, setEffortLevel] = useState("moderate");

  // Import filters
  const [importSource, setImportSource] = useState("strava");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Fetch activities from API
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/activities"],
  });

  // Format activities for display
  const formattedActivities = activities.map((activity: any) => ({
    id: activity.id,
    date: new Date(activity.activity_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    type: {
      name: activity.activity_type,
      icon: "chart" as const,
      color: "primary" as const
    },
    distance: activity.distance ? `${activity.distance} mi` : "N/A",
    time: activity.duration ? formatDuration(activity.duration) : "N/A",
    pace: activity.pace || "N/A",
    heartRate: activity.heart_rate ? `${activity.heart_rate} bpm` : "N/A",
    effort: {
      level: activity.effort_level || "moderate",
      label: activity.effort_level ? activity.effort_level.charAt(0).toUpperCase() + activity.effort_level.slice(1) : "Moderate"
    },
    source: activity.source || "manual"
  }));

  // Helper function to format duration from seconds
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  const handleSaveActivity = async () => {
    try {
      const activityData = {
        activity_date: activityDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        activity_type: activityType,
        distance: distance ? parseFloat(distance) : null,
        duration: duration ? parseInt(duration) * 60 : null, // Convert minutes to seconds
        heart_rate: heartRate ? parseInt(heartRate) : null,
        effort_level: effortLevel,
        notes: notes || null,
        source: "manual"
      };

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to save activity');
      }

      toast({
        title: "Activity saved",
        description: "Your activity has been logged successfully.",
      });

      setAddActivityOpen(false);
      
      // Reset form fields
      setActivityDate(new Date());
      setActivityType("run");
      setDistance("");
      setDuration("");
      setHeartRate("");
      setNotes("");
      setEffortLevel("moderate");

      // Refresh activities list
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportActivities = () => {
    // In a real app, this would initiate an import from the selected platform
    toast({
      title: "Import initiated",
      description: `Importing activities from ${importSource}...`,
    });
    
    // Simulate import
    setTimeout(() => {
      toast({
        title: "Import completed",
        description: "Your activities have been imported successfully.",
      });
      setImportActivitiesOpen(false);
    }, 2000);
  };
  
  const handleViewActivity = (activityId: number) => {
    setViewActivityId(activityId);
    setViewActivityOpen(true);
  };
  
  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setPage(1); // Reset to first page when changing page size
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "strava":
        return <Badge className="bg-orange-500/20 text-orange-300 border border-orange-400/30 drop-shadow-sm">Strava</Badge>;
      case "garmin":
        return <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 drop-shadow-sm">Garmin</Badge>;
      case "polar":
        return <Badge className="bg-red-500/20 text-red-300 border border-red-400/30 drop-shadow-sm">Polar</Badge>;
      case "manual":
        return <Badge className="bg-gray-500/20 text-gray-300 border border-gray-400/30 drop-shadow-sm">Manual</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border border-gray-400/30 drop-shadow-sm">Manual</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <div className="flex h-screen max-w-full overflow-hidden">
        <Sidebar />
        <MobileMenu />

        <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
          {/* For mobile view padding to account for fixed header */}
          <div className="md:hidden pt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">Activities</h1>
              <p className="text-white/80 mt-1">View and manage your running activities</p>
            </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Dialog open={importActivitiesOpen} onOpenChange={setImportActivitiesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center bg-white/10 hover:bg-white/20 text-white border-white/30 drop-shadow-sm">
                  <FileUp className="w-4 h-4 mr-2" />
                  Import Activities
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-900/95 via-blue-800/95 to-cyan-700/95 backdrop-blur-lg border border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white drop-shadow-sm">Import Activities</DialogTitle>
                  <DialogDescription className="text-white/70 drop-shadow-sm">
                    Import your running activities from connected platforms
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-source" className="text-white drop-shadow-sm">Select Source</Label>
                    <Select value={importSource} onValueChange={setImportSource}>
                      <SelectTrigger id="import-source" className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strava">Strava</SelectItem>
                        <SelectItem value="garmin">Garmin Connect</SelectItem>
                        <SelectItem value="polar">Polar Flow</SelectItem>
                        <SelectItem value="google_fit">Google Fit</SelectItem>
                        <SelectItem value="whoop">WHOOP</SelectItem>
                        <SelectItem value="apple_health">Apple Health</SelectItem>
                        <SelectItem value="fitbit">Fitbit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white drop-shadow-sm">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/20"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white drop-shadow-sm">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/20"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-white/60 drop-shadow-sm">
                      {importSource === "strava" && "Importing from Strava requires an active connection in your profile settings."}
                      {importSource === "garmin" && "Importing from Garmin Connect requires an active connection in your profile settings."}
                      {importSource === "polar" && "Importing from Polar Flow requires an active connection in your profile settings."}
                      {importSource === "google_fit" && "Importing from Google Fit requires an active connection in your profile settings."}
                      {importSource === "whoop" && "Importing from WHOOP requires an active connection in your profile settings."}
                      {importSource === "apple_health" && "Importing your Apple Health data requires using the AetherRun mobile app."}
                      {importSource === "fitbit" && "Importing from Fitbit requires an active connection in your profile settings."}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportActivitiesOpen(false)} className="bg-white/10 hover:bg-white/20 text-white border-white/30">Cancel</Button>
                  <Button onClick={handleImportActivities} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Import Activities
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center bg-white/20 hover:bg-white/30 text-white border-white/30 drop-shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-900/95 via-blue-800/95 to-cyan-700/95 backdrop-blur-lg border border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white drop-shadow-sm">Log New Activity</DialogTitle>
                  <DialogDescription className="text-white/70 drop-shadow-sm">
                    Manually add your workout details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity-type" className="text-white drop-shadow-sm">Activity Type</Label>
                    <Select value={activityType} onValueChange={setActivityType}>
                      <SelectTrigger id="activity-type" className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="run">Run</SelectItem>
                        <SelectItem value="long_run">Long Run</SelectItem>
                        <SelectItem value="tempo">Tempo Run</SelectItem>
                        <SelectItem value="interval">Interval Training</SelectItem>
                        <SelectItem value="trail">Trail Run</SelectItem>
                        <SelectItem value="race">Race</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white drop-shadow-sm">Activity Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityDate ? format(activityDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={activityDate}
                          onSelect={setActivityDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="distance" className="text-white drop-shadow-sm">Distance (miles)</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-white drop-shadow-sm">Duration (hh:mm:ss)</Label>
                      <Input
                        id="duration"
                        placeholder="00:00:00"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heart-rate" className="text-white drop-shadow-sm">Avg. Heart Rate (bpm)</Label>
                      <Input
                        id="heart-rate"
                        type="number"
                        placeholder="0"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effort-level" className="text-white drop-shadow-sm">Effort Level</Label>
                      <Select value={effortLevel} onValueChange={setEffortLevel}>
                        <SelectTrigger id="effort-level" className="bg-white/10 border-white/30 text-white">
                          <SelectValue placeholder="Select effort level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white drop-shadow-sm">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Add any notes about this activity"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddActivityOpen(false)} className="bg-white/10 hover:bg-white/20 text-white border-white/30">Cancel</Button>
                  <Button onClick={handleSaveActivity} className="bg-white/20 hover:bg-white/30 text-white border-white/30">Save Activity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Activities Content */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-white/10 backdrop-blur-sm border-white/20">
                <TabsTrigger value="all" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">All Activities</TabsTrigger>
                <TabsTrigger value="runs" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Runs</TabsTrigger>
                <TabsTrigger value="workouts" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Workouts</TabsTrigger>
                <TabsTrigger value="races" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Races</TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm" className="flex items-center text-xs bg-white/10 hover:bg-white/20 text-white border-white/30">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </Button>
            </div>
            
            <TabsContent value="all" className="space-y-4">
              <div className="flex justify-end items-center mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/70 drop-shadow-sm">Show:</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-[80px] bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableCaption className="text-white/70 drop-shadow-sm">A list of your recent activities.</TableCaption>
                <TableHeader>
                  <TableRow className="border-b border-white/20">
                    <TableHead className="text-white drop-shadow-sm">Date</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Activity</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Distance</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Time</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Pace</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Heart Rate</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Effort</TableHead>
                    <TableHead className="text-white drop-shadow-sm">Source</TableHead>
                    <TableHead className="text-right text-white drop-shadow-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell className="text-white/80 drop-shadow-sm">{activity.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {activity.type.icon === "chart" && <BarChart3 className="h-4 w-4 mr-2 text-blue-300" />}
                          {activity.type.icon === "speed" && <Clock className="h-4 w-4 mr-2 text-cyan-300" />}
                          {activity.type.icon === "activity" && <Navigation className="h-4 w-4 mr-2 text-blue-300" />}
                          <span className="text-white drop-shadow-sm">{activity.type.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80 drop-shadow-sm">{activity.distance}</TableCell>
                      <TableCell className="text-white/80 drop-shadow-sm">{activity.time}</TableCell>
                      <TableCell className="text-white/80 drop-shadow-sm">{activity.pace}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-400" />
                          <span className="text-white/80 drop-shadow-sm">{activity.heartRate}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          activity.effort.level === "easy" ? "bg-green-500/20 text-green-300 border-green-400/30" :
                          activity.effort.level === "moderate" ? "bg-blue-500/20 text-blue-300 border-blue-400/30" :
                          "bg-red-500/20 text-red-300 border-red-400/30"
                        }>
                          {activity.effort.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSourceBadge(activity.source)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewActivity(activity.id)}
                          className="text-white/80 hover:bg-white/10 hover:text-white"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Pagination>
                <PaginationContent className="text-white">
                  <PaginationItem>
                    <PaginationPrevious href="#" className="text-white/80 hover:bg-white/10 hover:text-white border-white/30" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive className="bg-white/20 text-white border-white/30">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" className="text-white/80 hover:bg-white/10 hover:text-white border-white/30">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" className="text-white/80 hover:bg-white/10 hover:text-white border-white/30">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis className="text-white/60" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" className="text-white/80 hover:bg-white/10 hover:text-white border-white/30" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
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
                                {activity.type.icon === "chart" && <BarChart3 className="h-5 w-5 mr-2 text-secondary" />}
                                {activity.type.icon === "speed" && <Clock className="h-5 w-5 mr-2 text-primary" />}
                                {activity.type.icon === "activity" && <Navigation className="h-5 w-5 mr-2 text-accent" />}
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
                                <Badge className={
                                  activity.effort.level === "easy" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                                  activity.effort.level === "moderate" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                  "bg-red-100 text-red-800 hover:bg-red-100"
                                }>
                                  {activity.effort.label}
                                </Badge>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Source</div>
                                {getSourceBadge(activity.source)}
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
                    <Button variant="outline" onClick={() => setViewActivityOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            <TabsContent value="runs" className="space-y-4">
              <div className="text-center py-4">
                <p>Run-specific activities will appear here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="workouts" className="space-y-4">
              <div className="text-center py-4">
                <p>Workout-specific activities will appear here.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="races" className="space-y-4">
              <div className="text-center py-4">
                <p>Race-specific activities will appear here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      </div>
    </div>
  );
}
