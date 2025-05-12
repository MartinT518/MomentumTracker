import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Coach } from '@shared/schema';

interface ChatMessage {
  id: string;
  content: string;
  sender: string | number;
  timestamp: string;
  isCoach: boolean;
}

interface CoachChatProps {
  coach: Coach;
  sessionId: string;
}

export function CoachChat({ coach, sessionId }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [showPlanUpdate, setShowPlanUpdate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Effect to initialize WebSocket connection
  useEffect(() => {
    if (!user || !coach || !sessionId) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      
      // Send initialization message
      ws.send(JSON.stringify({
        type: 'init',
        userId: user.id,
        sessionId
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);
        
        // Handle different message types
        if (data.type === 'init_confirmed') {
          toast({
            title: "Connected to coach",
            description: "You can now chat with your coach",
          });
        }
        else if (data.type === 'chat_message') {
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            content: data.message,
            sender: data.sender,
            timestamp: data.timestamp,
            isCoach: data.sender === coach.user_id
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
        else if (data.type === 'plan_update_request') {
          setShowPlanUpdate(true);
          toast({
            title: "Training Plan Update",
            description: "Your coach has suggested changes to your training plan. Please review and approve.",
            duration: 10000,
          });
        }
        else if (data.type === 'error') {
          console.error("WebSocket error:", data.message);
          toast({
            title: "Connection Error",
            description: data.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "Connection to coach lost. Trying to reconnect...",
        variant: "destructive"
      });
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to coaching service",
        variant: "destructive"
      });
    };
    
    setSocket(ws);
    
    // Cleanup function
    return () => {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [user, coach, sessionId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send a message
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || !connected) return;
    
    const message = {
      type: 'chat_message',
      message: inputMessage,
      sender: user?.id,
      athleteId: user?.id,
      sessionId,
      isCoach: false,
    };
    
    socket.send(JSON.stringify(message));
    setInputMessage('');
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Approve or reject plan updates
  const handlePlanUpdateResponse = (approved: boolean) => {
    if (!socket || !connected) return;
    
    socket.send(JSON.stringify({
      type: 'plan_update_response',
      approved,
      coachId: coach.user_id,
      athleteId: user?.id,
      sessionId
    }));
    
    setShowPlanUpdate(false);
    
    toast({
      title: approved ? "Plan Changes Approved" : "Plan Changes Rejected",
      description: approved 
        ? "The coach's changes to your training plan have been applied" 
        : "You've declined the coach's changes to your training plan",
    });
  };
  
  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={coach.profile_image || ''} />
              <AvatarFallback>{coach.name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{coach.name}</CardTitle>
              <CardDescription>{coach.specialty || 'Running Coach'}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">{connected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </CardHeader>
      
      <Separator className="mb-2" />
      
      {showPlanUpdate && (
        <div className="mx-4 my-2 p-3 bg-amber-50 border border-amber-200 rounded-md flex flex-col">
          <div className="flex items-start space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Training Plan Update</h4>
              <p className="text-sm text-muted-foreground">
                Your coach has suggested changes to your training plan. Would you like to accept these changes?
              </p>
            </div>
          </div>
          <div className="flex space-x-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => handlePlanUpdateResponse(false)}>
              Decline
            </Button>
            <Button size="sm" onClick={() => handlePlanUpdateResponse(true)}>
              Accept Changes
            </Button>
          </div>
        </div>
      )}
      
      <CardContent className="flex-grow overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start chatting with your coach to get personalized advice and training plan adjustments
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.isCoach ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.isCoach 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString(undefined, { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex w-full space-x-2">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!connected}
            className="flex-grow"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!connected || !inputMessage.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}