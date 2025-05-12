import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SendHorizontal, Paperclip, Clock, Check, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Coach } from '@shared/schema';

// Websocket connection for real-time chat
let socket: WebSocket | null = null;

interface Message {
  id: string;
  from: 'coach' | 'user';
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface TrainingPlanSuggestion {
  id: string;
  description: string;
  date: Date;
  workout: {
    type: string;
    details: string;
    changes: string;
  };
  accepted: boolean;
}

interface CoachChatProps {
  coach: Coach;
  sessionId: string;
}

export function CoachChat({ coach, sessionId }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [planSuggestions, setPlanSuggestions] = useState<TrainingPlanSuggestion[]>([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Setup WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?sessionId=${sessionId}`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket Connected');
      
      // Fetch chat history
      if (socket) {
        socket.send(JSON.stringify({
          type: 'history',
          sessionId
        }));
      }
    };
    
    socket.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket Disconnected');
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to coaching session",
        variant: "destructive",
      });
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          const newMessage: Message = {
            id: data.id,
            from: data.from,
            text: data.text,
            timestamp: new Date(data.timestamp),
            status: data.status || 'sent'
          };
          setMessages(prev => [...prev, newMessage]);
          break;
          
        case 'history':
          const history: Message[] = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(history);
          break;
          
        case 'typing':
          setIsTyping(data.isTyping);
          break;
          
        case 'plan_suggestion':
          const suggestion: TrainingPlanSuggestion = {
            id: data.id,
            description: data.description,
            date: new Date(data.date),
            workout: data.workout,
            accepted: false
          };
          setPlanSuggestions(prev => [...prev, suggestion]);
          break;
          
        case 'status_update':
          setMessages(prev => 
            prev.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, status: data.status } 
                : msg
            )
          );
          break;
      }
    };
    
    // Add initial welcome message if no messages exist
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        from: 'coach',
        text: `Hello! I'm ${coach.name}, your running coach. I'm here to help you with your training plan and answer any questions you might have. How can I assist you today?`,
        timestamp: new Date(),
        status: 'read'
      };
      setMessages([welcomeMessage]);
    }
    
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sessionId, coach.name, toast]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = () => {
    if (!message.trim() || !isConnected || !socket) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: message,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    socket.send(JSON.stringify({
      type: 'message',
      text: message,
      sessionId
    }));
    
    setMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleSuggestionResponse = (suggestionId: string, accept: boolean) => {
    if (!socket) return;
    
    socket.send(JSON.stringify({
      type: 'suggestion_response',
      suggestionId,
      accept,
      sessionId
    }));
    
    setPlanSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, accepted: accept } 
          : suggestion
      )
    );
    
    toast({
      title: accept ? "Workout Accepted" : "Workout Declined",
      description: accept 
        ? "The suggested workout has been added to your plan" 
        : "You've declined this workout suggestion",
    });
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={coach.profile_image || ''} />
              <AvatarFallback>{coach.name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{coach.name}</CardTitle>
              <CardDescription>{coach.specialty || 'Running Coach'}</CardDescription>
            </div>
            <div className="ml-auto flex items-center">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full mr-2",
                isConnected ? "bg-green-500" : "bg-gray-400"
              )}></span>
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={msg.id || index}
                className={cn(
                  "flex",
                  msg.from === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  msg.from === 'user' 
                    ? "bg-primary/10 text-foreground" 
                    : "bg-muted"
                )}>
                  <div className="text-sm">{msg.text}</div>
                  <div className="flex justify-end items-center mt-1">
                    <span className="text-xs text-muted-foreground mr-1">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.from === 'user' && (
                      <span>
                        {msg.status === 'sent' && (
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        )}
                        {msg.status === 'delivered' && (
                          <Check className="h-3 w-3 text-muted-foreground" />
                        )}
                        {msg.status === 'read' && (
                          <div className="flex">
                            <Check className="h-3 w-3 text-blue-500 -mr-1" />
                            <Check className="h-3 w-3 text-blue-500" />
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Workout suggestions */}
            {planSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <PenLine className="h-5 w-5 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium mb-1">Training Plan Suggestion</div>
                    <div className="text-sm mb-2">{suggestion.description}</div>
                    
                    <div className="bg-white rounded p-3 mb-3 text-sm">
                      <div className="font-medium">{suggestion.workout.type}</div>
                      <div className="text-gray-600 mt-1">{suggestion.workout.details}</div>
                      <div className="text-blue-600 mt-2">
                        <span className="font-medium">Changes: </span>
                        {suggestion.workout.changes}
                      </div>
                    </div>
                    
                    {suggestion.accepted ? (
                      <div className="text-green-600 text-sm flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        Added to your plan
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleSuggestionResponse(suggestion.id, true)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSuggestionResponse(suggestion.id, false)}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* This div is for scrolling to the bottom */}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <div className="p-3 border-t">
          <div className="flex space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[42px] resize-none"
              disabled={!isConnected}
            />
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" disabled={!isConnected}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={sendMessage} disabled={!isConnected || !message.trim()}>
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}