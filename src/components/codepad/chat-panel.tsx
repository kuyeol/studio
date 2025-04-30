
"use client";

import * as React from "react";
import { Send, User, Bot, Loader2, Sparkles, X } from "lucide-react"; // Add X
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Message } from "@/ai/flows/chat-flow"; // Import the Message type
import { cn } from "@/lib/utils";
// Removed: import { useIsMobile } from "@/hooks/use-mobile";
// Removed: import { SheetClose } from "@/components/ui/sheet";

interface ChatPanelProps {
  messages: Message[]; // Keep the type definition as Message[]
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export default function ChatPanel({ messages = [], onSendMessage, isLoading }: ChatPanelProps) { // Default messages to []
  const [inputMessage, setInputMessage] = React.useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  // Removed: const isMobile = useIsMobile(); // Check if mobile

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const messageToSend = inputMessage;
    setInputMessage(""); // Clear input immediately
    await onSendMessage(messageToSend);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in input
      handleSend();
    }
  };

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if(scrollElement) {
         scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);


  return (
    // Use bg-secondary for the chat panel background for slight distinction
    // Removed md:border-l md:border-t-0 as this is now self-contained for mobile sheets
    <div className="flex flex-col h-full bg-secondary text-secondary-foreground border-t border-border"> {/* Added top border for bottom sheet */}
       {/* Header - Removed SheetClose */}
       <div className="p-4 border-b border-border flex items-center justify-between gap-2 bg-card text-card-foreground flex-shrink-0"> {/* Header remains card background */}
          <div className="flex items-center gap-2">
             <Sparkles className="h-5 w-5 text-primary" />
             <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
           {/* Mobile close button is handled by SheetContent's default X - Removed */}
       </div>
      {/* ScrollArea uses output-panel style for scrollbar, content padding added here */}
      <ScrollArea className="flex-grow p-4 output-panel" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => ( // Now safe to map as messages defaults to []
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "model" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground"> {/* Adjusted AI avatar background */}
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm break-words shadow-sm", // Added subtle shadow
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground" // User messages use primary color
                    : "bg-card text-card-foreground border border-border" // AI messages use card background with border
                )}
              >
                {/* Simple rendering of content, consider markdown later */}
                {msg.content}
              </div>
               {msg.role === "user" && (
                <Avatar className="h-8 w-8">
                  {/* User avatar with secondary background */}
                  <AvatarFallback className="bg-secondary-foreground text-secondary">
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <Avatar className="h-8 w-8">
                   <AvatarFallback className="bg-muted text-muted-foreground">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
               {/* Loading indicator uses card background */}
              <div className="bg-card text-card-foreground border border-border rounded-lg px-3 py-2 text-sm flex items-center space-x-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> {/* Spinner uses primary color */}
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
       {/* Input area uses card background */}
      <div className="p-4 border-t border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ask the AI anything..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-grow bg-background focus:bg-background" // Ensure input field background is consistent
          />
          <Button onClick={handleSend} disabled={isLoading || !inputMessage.trim()} size="icon">
             <Send className="h-4 w-4" />
             <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
