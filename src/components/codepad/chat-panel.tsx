
"use client";

import * as React from "react";
import { Send, User, Bot, Loader2, Sparkles, X } from "lucide-react"; // Add X
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Message } from "@/ai/flows/chat-flow"; // Import the Message type
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { SheetClose } from "@/components/ui/sheet"; // Import SheetClose

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export default function ChatPanel({ messages, onSendMessage, isLoading }: ChatPanelProps) {
  const [inputMessage, setInputMessage] = React.useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(); // Check if mobile

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
    <div className="flex flex-col h-full bg-card text-card-foreground border-l border-border">
       {/* Header with optional close button */}
       <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
             <Sparkles className="h-5 w-5 text-primary" />
             <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
           {isMobile && (
               <SheetClose asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                   <X className="h-4 w-4" />
                   <span className="sr-only">Close Chat</span>
                 </Button>
               </SheetClose>
            )}
       </div>
      <ScrollArea className="flex-grow p-4 output-panel" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "model" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm break-words",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {/* Simple rendering of content, consider markdown later */}
                {msg.content}
              </div>
               {msg.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ask the AI anything..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-grow"
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

