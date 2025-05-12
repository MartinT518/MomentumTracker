import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [importActivitiesOpen, setImportActivitiesOpen] = useState(false);
  
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

  // Mock activities for display
  const activities = [
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
      },
      source: "manual"
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
      },
      source: "strava"
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
      },
      source: "garmin"
    }
  ];

  const handleSaveActivity = () => {
    // In a real app, send to backend API
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

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "strava":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Strava</Badge>;
      case "garmin":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Garmin</Badge>;
      case "polar":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Polar</Badge>;
      case "manual":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Manual</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Manual</Badge>;
    }
  };

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Activities</h1>
            <p className="text-neutral-medium mt-1">View and manage your running activities</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Dialog open={importActivitiesOpen} onOpenChange={setImportActivitiesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <FileUp className="w-4 h-4 mr-2" />
                  Import Activities
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Import Activities</DialogTitle>
                  <DialogDescription>
                    Import your running activities from connected platforms
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-source">Select Source</Label>
                    <Select value={importSource} onValueChange={setImportSource}>
                      <SelectTrigger id="import-source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strava">Strava</SelectItem>
                        <SelectItem value="garmin">Garmin Connect</SelectItem>
                        <SelectItem value="polar">Polar Flow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
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
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
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
                    <p className="text-sm text-muted-foreground">
                      {importSource === "strava" && "Importing from Strava requires an active connection in your profile settings."}
                      {importSource === "garmin" && "Importing from Garmin Connect requires an active connection in your profile settings."}
                      {importSource === "polar" && "Importing from Polar Flow requires an active connection in your profile settings."}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportActivitiesOpen(false)}>Cancel</Button>
                  <Button onClick={handleImportActivities}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Import Activities
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Log New Activity</DialogTitle>
                  <DialogDescription>
                    Manually add your workout details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity-type">Activity Type</Label>
                    <Select value={activityType} onValueChange={setActivityType}>
                      <SelectTrigger id="activity-type">
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
                    <Label>Activity Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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
                      <Label htmlFor="distance">Distance (miles)</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (hh:mm:ss)</Label>
                      <Input
                        id="duration"
                        placeholder="00:00:00"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heart-rate">Avg. Heart Rate (bpm)</Label>
                      <Input
                        id="heart-rate"
                        type="number"
                        placeholder="0"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effort-level">Effort Level</Label>
                      <Select value={effortLevel} onValueChange={setEffortLevel}>
                        <SelectTrigger id="effort-level">
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
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Add any notes about this activity"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddActivityOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveActivity}>Save Activity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Activities Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Activities</TabsTrigger>
                <TabsTrigger value="runs">Runs</TabsTrigger>
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="races">Races</TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm" className="flex items-center text-xs">
                <Filter className="w-3 h-3 mr-1" />
                Filter
              </Button>
            </div>
            
            <TabsContent value="all" className="space-y-4">
              <Table>
                <TableCaption>A list of your recent activities.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Pace</TableHead>
                    <TableHead>Heart Rate</TableHead>
                    <TableHead>Effort</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {activity.type.icon === "chart" && <BarChart3 className="h-4 w-4 mr-2 text-secondary" />}
                          {activity.type.icon === "speed" && <Clock className="h-4 w-4 mr-2 text-primary" />}
                          {activity.type.icon === "activity" && <Navigation className="h-4 w-4 mr-2 text-accent" />}
                          <span>{activity.type.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{activity.distance}</TableCell>
                      <TableCell>{activity.time}</TableCell>
                      <TableCell>{activity.pace}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          {activity.heartRate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          activity.effort.level === "easy" ? "bg-green-100 text-green-800" :
                          activity.effort.level === "moderate" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {activity.effort.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSourceBadge(activity.source)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
  );
}
