import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessagesSquare, X, Send, Minimize2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  links?: { title: string; url: string }[];
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hi there! 👋 I\'m your MomentumRun assistant. How can I help you today with your training or app questions?',
    timestamp: new Date(),
    links: [
      { title: 'Training Plans', url: '/training-plan' },
      { title: 'Subscription', url: '/subscription' },
      { title: 'Health Metrics', url: '/health-metrics' }
    ]
  }
];

const supportTopics = [
  { title: 'Connect fitness tracker', url: '/settings' },
  { title: 'Training plan help', url: '/training-plan' },
  { title: 'Subscription info', url: '/subscription' },
  { title: 'Health metrics', url: '/health-metrics' },
  { title: 'Account settings', url: '/profile' }
];

export function SupportChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Scroll to bottom of messages when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when chat is opened
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // In a real implementation, we would call the AI backend
      // const response = await apiRequest('POST', '/api/support-chat', { message: inputValue });
      // const data = await response.json();
      
      // For now, simulate a response
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Match keywords in the user's message to provide relevant responses
      let botResponse = '';
      let links: { title: string; url: string }[] = [];
      
      const lcMessage = inputValue.toLowerCase();
      
      if (lcMessage.includes('subscription') || lcMessage.includes('payment') || lcMessage.includes('premium')) {
        botResponse = 'Our premium subscription gives you access to advanced training features, AI-powered plan adjustments, and personalized coaching. You can subscribe from the subscription page.';
        links = [{ title: 'Subscription Plans', url: '/subscription' }];
      } 
      else if (lcMessage.includes('connect') || lcMessage.includes('strava') || lcMessage.includes('garmin') || lcMessage.includes('polar')) {
        botResponse = 'You can connect your fitness devices like Strava, Garmin, or Polar in the Settings > Integrations section. This allows automatic activity syncing.';
        links = [{ title: 'Integration Settings', url: '/settings' }];
      }
      else if (lcMessage.includes('training') || lcMessage.includes('plan') || lcMessage.includes('workout')) {
        botResponse = 'Your training plan can be accessed and modified in the Training Plan section. Premium subscribers can get AI-generated plans and adjustments based on their performance.';
        links = [{ title: 'Training Plans', url: '/training-plan' }];
      }
      else if (lcMessage.includes('metrics') || lcMessage.includes('health') || lcMessage.includes('hrv') || lcMessage.includes('heart')) {
        botResponse = 'Health metrics like sleep quality, HRV, and resting heart rate help optimize your training. View and track them in the Health Metrics section.';
        links = [{ title: 'Health Metrics', url: '/health-metrics' }];
      }
      else if (lcMessage.includes('account') || lcMessage.includes('profile') || lcMessage.includes('settings')) {
        botResponse = 'You can manage your account settings, profile information, and privacy preferences in the Profile section.';
        links = [{ title: 'Profile Settings', url: '/profile' }];
      }
      else if (lcMessage.includes('thank')) {
        botResponse = 'You\'re welcome! Is there anything else I can help you with?';
      }
      else if (lcMessage.includes('hello') || lcMessage.includes('hi') || lcMessage.includes('hey')) {
        botResponse = `Hello${user ? ' ' + user.username : ''}! How can I help you with MomentumRun today?`;
        links = supportTopics;
      }
      else {
        botResponse = 'I\'m not sure I understand. Would you like to browse some common topics to get help?';
        links = supportTopics;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date(),
        links
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else if (isOpen) {
      setIsMinimized(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isBot = message.sender === 'bot';
    
    return (
      <div className={cn("flex", isBot ? "justify-start" : "justify-end")}>
        <div className={cn(
          "flex items-start gap-2 max-w-[80%]",
          isBot ? "flex-row" : "flex-row-reverse"
        )}>
          {isBot && (
            <Avatar className="mt-1 h-8 w-8">
              <AvatarFallback className="bg-primary text-white">MR</AvatarFallback>
            </Avatar>
          )}
          
          <div className={cn(
            "rounded-lg px-4 py-2 my-1",
            isBot 
              ? "bg-muted text-foreground" 
              : "bg-primary text-primary-foreground"
          )}>
            <div className="text-sm">{message.text}</div>
            
            {message.links && message.links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.links.map((link, i) => (
                  <Link key={i} href={link.url}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      {link.title}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Chat button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleToggle}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg",
            isOpen && !isMinimized && "hidden"
          )}
        >
          <MessagesSquare className="h-5 w-5" />
        </Button>
        
        {/* Chat window */}
        {isOpen && !isMinimized && (
          <div
            className="fixed bottom-4 right-4 w-80 sm:w-96 h-[500px] max-h-[calc(100vh-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0 border-b">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">MR</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg font-medium">Support</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setIsMinimized(true)}>
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="flex flex-col space-y-2">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 max-w-[80%]">
                          <Avatar className="mt-1 h-8 w-8">
                            <AvatarFallback className="bg-primary text-white">MR</AvatarFallback>
                          </Avatar>
                          <div className="rounded-lg px-4 py-3 my-1 bg-muted text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="p-3 border-t">
                <form onSubmit={handleSubmit} className="flex items-center w-full gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Minimized chat indicator */}
        {isOpen && isMinimized && (
          <div
            className="fixed bottom-4 right-16 bg-primary text-primary-foreground rounded-full px-3 py-1.5 shadow-md animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            <span className="text-sm font-medium">Support Chat</span>
          </div>
        )}
      </div>
    </>
  );
}