import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Users,
  UserPlus,
  Calendar as CalendarIcon,
  Search,
  Trophy,
  TrendingUp,
  Flag,
  Filter,
  Plus,
  Target,
  User,
  UserCheck,
  UserX,
  MessageSquare,
  Clock,
  Shield,
  UserCircle,
  Group,
  MapPin,
} from "lucide-react";

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("groups");
  const [searchTerm, setSearchTerm] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  
  // Group creation states
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupType, setGroupType] = useState("public");
  const [groupGoalType, setGroupGoalType] = useState("5k");

  // Challenge creation states
  const [challengeName, setChallengeName] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeStartDate, setChallengeStartDate] = useState<Date>(new Date());
  const [challengeEndDate, setChallengeEndDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [challengeType, setChallengeType] = useState("distance");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [isPublicChallenge, setIsPublicChallenge] = useState(true);

  // Group types mapping for display
  const goalTypeDisplay = {
    "5k": "5K",
    "10k": "10K",
    "half_marathon": "Half Marathon",
    "marathon": "Marathon",
    "trail": "Trail Running",
    "weight_loss": "Weight Loss",
    "general": "General Fitness"
  };

  // API data queries
  const { 
    data: groupsData = [], 
    isLoading: isLoadingGroups 
  } = useQuery({
    queryKey: ['/api/groups'],
    refetchOnWindowFocus: false,
  });

  const { 
    data: myGroupsData = [], 
    isLoading: isLoadingMyGroups 
  } = useQuery({
    queryKey: ['/api/groups/me'],
    refetchOnWindowFocus: false,
  });

  const { 
    data: challengesData = [], 
    isLoading: isLoadingChallenges 
  } = useQuery({
    queryKey: ['/api/challenges'],
    refetchOnWindowFocus: false,
  });

  const { 
    data: myChallengesData = [], 
    isLoading: isLoadingMyChallenges 
  } = useQuery({
    queryKey: ['/api/challenges/me'],
    refetchOnWindowFocus: false,
  });

  const { 
    data: buddiesData = [], 
    isLoading: isLoadingBuddies 
  } = useQuery({
    queryKey: ['/api/buddies'],
    refetchOnWindowFocus: false,
  });

  const { 
    data: buddyRequestsData = [], 
    isLoading: isLoadingBuddyRequests 
  } = useQuery({
    queryKey: ['/api/buddies/requests'],
    refetchOnWindowFocus: false,
  });

  // Process data to display format
  const groups = isLoadingGroups ? [] : groupsData.map((group) => {
    const isMember = myGroupsData.some(myGroup => myGroup.id === group.id);
    return {
      ...group,
      is_member: isMember
    };
  });
  
  const challenges = isLoadingChallenges ? [] : challengesData.map((challenge) => {
    const joined = myChallengesData.some(myChallenge => myChallenge.id === challenge.id);
    // Format dates to display format
    const startDate = new Date(challenge.start_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const endDate = new Date(challenge.end_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return {
      ...challenge,
      is_joined: joined,
      start_date: startDate,
      end_date: endDate,
      participants: Math.floor(Math.random() * 300) + 50, // Temporary until we implement participant count
      progress: joined ? Math.floor(Math.random() * 80) + 10 : 0 // Temporary until we implement progress tracking
    };
  });
  
  // For the buddies, we would need to fetch user profiles as well
  // For now, use placeholder data but structure it like real data
  const buddies = [
    {
      id: 1,
      username: "runner_jane",
      name: "Jane Smith",
      status: "active",
      goal_type: "marathon",
      pace: "8:45 /mi",
      location: "Boston, MA",
      image: "",
      relation: "buddy", // buddy, pending_sent, pending_received, none
    },
    {
      id: 2,
      username: "mike_runner",
      name: "Mike Johnson",
      status: "active",
      goal_type: "half_marathon",
      pace: "9:15 /mi",
      location: "Chicago, IL",
      image: "",
      relation: "pending_sent",
    },
    {
      id: 3,
      username: "track_star",
      name: "Sarah Williams",
      status: "active",
      goal_type: "5k",
      pace: "7:30 /mi",
      location: "Denver, CO",
      image: "",
      relation: "none",
    },
    {
      id: 4,
      username: "trail_master",
      name: "Alex Thompson",
      status: "active",
      goal_type: "trail",
      pace: "10:00 /mi",
      location: "Portland, OR",
      image: "",
      relation: "pending_received",
    },
  ];

  // Filtered data based on search term
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChallenges = challenges.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBuddies = buddies.filter(b => 
    b.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create group');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/me'] });
      
      toast({
        title: "Group Created",
        description: `Your group "${groupName}" has been created successfully.`,
      });
      
      setCreateGroupOpen(false);
      setGroupName("");
      setGroupDescription("");
      setGroupType("public");
      setGroupGoalType("5k");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengeData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/me'] });
      
      toast({
        title: "Challenge Created",
        description: `Your challenge "${challengeName}" has been created successfully.`,
      });
      
      setCreateChallengeOpen(false);
      setChallengeName("");
      setChallengeDescription("");
      setChallengeType("distance");
      setChallengeTarget("");
      setIsPublicChallenge(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to join group');
      }
      
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/me'] });
      
      const group = groups.find(g => g.id === variables);
      
      toast({
        title: "Group Joined",
        description: `You have successfully joined "${group?.name}".`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Joining Group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to leave group');
      }
      
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/me'] });
      
      const group = groups.find(g => g.id === variables);
      
      toast({
        title: "Left Group",
        description: `You have left "${group?.name}".`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Leaving Group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to join challenge');
      }
      
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/me'] });
      
      const challenge = challenges.find(c => c.id === variables);
      
      toast({
        title: "Challenge Joined",
        description: `You have joined the "${challenge?.name}" challenge.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Joining Challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const leaveChallengeeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const res = await fetch(`/api/challenges/${challengeId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to leave challenge');
      }
      
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/me'] });
      
      const challenge = challenges.find(c => c.id === variables);
      
      toast({
        title: "Left Challenge",
        description: `You have left the "${challenge?.name}" challenge.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Leaving Challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Action handlers
  const handleCreateGroup = () => {
    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription,
      type: groupType,
      goal_type: groupGoalType,
    });
  };

  const handleCreateChallenge = () => {
    const startDateValue = challengeStartDate.toISOString().split('T')[0];
    const endDateValue = challengeEndDate.toISOString().split('T')[0];
    
    createChallengeMutation.mutate({
      name: challengeName,
      description: challengeDescription,
      start_date: startDateValue,
      end_date: endDateValue,
      challenge_type: challengeType,
      target_value: parseFloat(challengeTarget),
      is_public: isPublicChallenge,
    });
  };

  const handleJoinGroup = (groupId: number, groupName: string) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleLeaveGroup = (groupId: number, groupName: string) => {
    leaveGroupMutation.mutate(groupId);
  };

  const handleJoinChallenge = (challengeId: number, challengeName: string) => {
    joinChallengeMutation.mutate(challengeId);
  };

  const handleLeaveChallenge = (challengeId: number, challengeName: string) => {
    leaveChallengeeMutation.mutate(challengeId);
  };

  const handleBuddyAction = (buddyId: number, action: string, buddyName: string) => {
    switch (action) {
      case "add":
        toast({
          title: "Buddy Request Sent",
          description: `Your buddy request to ${buddyName} has been sent.`,
        });
        break;
      case "accept":
        toast({
          title: "Buddy Request Accepted",
          description: `You and ${buddyName} are now training buddies!`,
        });
        break;
      case "reject":
        toast({
          title: "Buddy Request Declined",
          description: `You have declined ${buddyName}'s buddy request.`,
        });
        break;
      case "remove":
        toast({
          title: "Buddy Removed",
          description: `${buddyName} has been removed from your buddies.`,
        });
        break;
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
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Community</h1>
            <p className="text-neutral-medium mt-1">Connect with other runners, join groups, and participate in challenges</p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {activeTab === "groups" && (
              <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Start a group for runners with similar interests or goals
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Description</Label>
                      <Input
                        id="group-description"
                        placeholder="Describe what your group is about"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-type">Group Type</Label>
                        <Select value={groupType} onValueChange={setGroupType}>
                          <SelectTrigger id="group-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="training">Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="group-goal-type">Goal Type</Label>
                        <Select value={groupGoalType} onValueChange={setGroupGoalType}>
                          <SelectTrigger id="group-goal-type">
                            <SelectValue placeholder="Select goal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5k">5K</SelectItem>
                            <SelectItem value="10k">10K</SelectItem>
                            <SelectItem value="half_marathon">Half Marathon</SelectItem>
                            <SelectItem value="marathon">Marathon</SelectItem>
                            <SelectItem value="trail">Trail Running</SelectItem>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="general">General Fitness</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup}>Create Group</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "challenges" && (
              <Dialog open={createChallengeOpen} onOpenChange={setCreateChallengeOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Challenge
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Challenge</DialogTitle>
                    <DialogDescription>
                      Create a challenge to motivate the community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="challenge-name">Challenge Name</Label>
                      <Input
                        id="challenge-name"
                        placeholder="Enter challenge name"
                        value={challengeName}
                        onChange={(e) => setChallengeName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="challenge-description">Description</Label>
                      <Input
                        id="challenge-description"
                        placeholder="Describe your challenge"
                        value={challengeDescription}
                        onChange={(e) => setChallengeDescription(e.target.value)}
                      />
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
                              {challengeStartDate ? format(challengeStartDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={challengeStartDate}
                              onSelect={(date) => date && setChallengeStartDate(date)}
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
                              {challengeEndDate ? format(challengeEndDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={challengeEndDate}
                              onSelect={(date) => date && setChallengeEndDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="challenge-type">Challenge Type</Label>
                        <Select value={challengeType} onValueChange={setChallengeType}>
                          <SelectTrigger id="challenge-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="distance">Distance</SelectItem>
                            <SelectItem value="elevation">Elevation</SelectItem>
                            <SelectItem value="streak">Streak</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="challenge-target">Target Value</Label>
                        <Input
                          id="challenge-target"
                          placeholder="e.g. 100 miles"
                          value={challengeTarget}
                          onChange={(e) => setChallengeTarget(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateChallengeOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateChallenge}>Create Challenge</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups, challenges, or buddies..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="groups" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="groups" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center">
              <Trophy className="mr-2 h-4 w-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="buddies" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Find Buddies
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                  <p className="text-neutral-medium mb-4">Try adjusting your search or create a new group</p>
                  <Button onClick={() => setCreateGroupOpen(true)}>Create Group</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
                        <Badge variant="outline">
                          {group.goal_type === "5k" ? "5K" : 
                           group.goal_type === "10k" ? "10K" : 
                           group.goal_type === "half_marathon" ? "Half Marathon" : 
                           group.goal_type === "marathon" ? "Marathon" : 
                           group.goal_type === "trail" ? "Trail Running" : 
                           group.goal_type === "weight_loss" ? "Weight Loss" : 
                           "General Fitness"}
                        </Badge>
                      </div>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1.5" />
                        <span>{group.member_count} members</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      {group.is_member ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleLeaveGroup(group.id, group.name)}
                        >
                          Leave Group
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => handleJoinGroup(group.id, group.name)}
                        >
                          Join Group
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            {filteredChallenges.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
                  <p className="text-neutral-medium mb-4">Try adjusting your search or create a new challenge</p>
                  <Button onClick={() => setCreateChallengeOpen(true)}>Create Challenge</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                  <Card key={challenge.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{challenge.name}</CardTitle>
                        <Badge className={
                          challenge.challenge_type === "distance" ? "bg-blue-100 text-blue-800" :
                          challenge.challenge_type === "elevation" ? "bg-green-100 text-green-800" :
                          challenge.challenge_type === "streak" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {challenge.challenge_type.charAt(0).toUpperCase() + challenge.challenge_type.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Target className="h-4 w-4 mr-1.5" />
                          <span>Target: {challenge.target_value}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1.5" />
                          <span>{challenge.start_date} - {challenge.end_date}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Users className="h-4 w-4 mr-1.5" />
                          <span>{challenge.participants} participants</span>
                        </div>
                        
                        {challenge.is_joined && (
                          <div className="mt-2">
                            <div className="text-sm flex justify-between mb-1">
                              <span>Your progress:</span>
                              <span className="font-medium">{challenge.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-primary h-2.5 rounded-full" 
                                style={{ width: `${challenge.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      {challenge.is_joined ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleLeaveChallenge(challenge.id, challenge.name)}
                        >
                          Leave Challenge
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => handleJoinChallenge(challenge.id, challenge.name)}
                        >
                          Join Challenge
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Buddies Tab */}
          <TabsContent value="buddies">
            {filteredBuddies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No runners found</h3>
                  <p className="text-neutral-medium">Try adjusting your search criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuddies.map((buddy) => (
                  <Card key={buddy.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={buddy.image} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {buddy.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-semibold">{buddy.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">@{buddy.username}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Flag className="h-4 w-4 mr-1.5" />
                          <span>
                            {buddy.goal_type === "5k" ? "5K" : 
                             buddy.goal_type === "10k" ? "10K" : 
                             buddy.goal_type === "half_marathon" ? "Half Marathon" : 
                             buddy.goal_type === "marathon" ? "Marathon" : 
                             buddy.goal_type === "trail" ? "Trail" : 
                             "General"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>Pace: {buddy.pace}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-1.5" />
                        <span>{buddy.location}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      {buddy.relation === "buddy" && (
                        <div className="flex space-x-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleBuddyAction(buddy.id, "remove", buddy.name)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      )}
                      
                      {buddy.relation === "pending_sent" && (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled
                        >
                          Request Sent
                        </Button>
                      )}
                      
                      {buddy.relation === "pending_received" && (
                        <div className="flex space-x-2 w-full">
                          <Button 
                            className="flex-1"
                            onClick={() => handleBuddyAction(buddy.id, "accept", buddy.name)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleBuddyAction(buddy.id, "reject", buddy.name)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}
                      
                      {buddy.relation === "none" && (
                        <Button 
                          className="w-full"
                          onClick={() => handleBuddyAction(buddy.id, "add", buddy.name)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Buddy
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}