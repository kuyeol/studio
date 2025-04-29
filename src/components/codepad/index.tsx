
"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeEditor from "./code-editor";
import OutputPanel from "./output-panel";
import ChatPanel from "./chat-panel"; // Import ChatPanel
import { Button } from "@/components/ui/button";
import { Play, Trash2, MessageSquare } from "lucide-react";
import { chat, type Message, type ChatInput, type ChatOutput } from "@/ai/flows/chat-flow"; // Import chat flow and types
import { useToast } from "@/hooks/use-toast";

export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Start coding here!\nconsole.log('Hello, CodePad!');");
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);

  // State for Chat
  const [isChatPanelOpen, setIsChatPanelOpen] = React.useState(true); // Default to open
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const { toast } = useToast();

  // Dummy execution function - replace with actual backend call
  const executeCode = async () => {
    setIsRunning(true);
    setOutput(["Executing code..."]);

    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // In a real scenario, this would be an API call to a backend service
      // that safely executes the Node.js code in a sandboxed environment.
      // For this frontend demo, we'll just log the code.
      console.log("Executing code:\n", code);
      setOutput([`Simulated execution complete. Output:` , `Hello, CodePad!`]); // Example output
    } catch (error: any) {
      setOutput([`Error: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const toggleChatPanel = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  // Function to handle sending chat messages
  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsChatLoading(true);

    try {
      // Prepare input for the chat flow
      const chatInput: ChatInput = {
        history: messages, // Pass the current history
        message: userMessage,
      };

      // Call the Genkit flow
      const result: ChatOutput = await chat(chatInput);

      const aiResponseMessage: Message = { role: "model", content: result.response };
      setMessages((prevMessages) => [...prevMessages, aiResponseMessage]);

    } catch (error) {
      console.error("Error calling chat flow:", error);
      toast({
        variant: "destructive",
        title: "AI Chat Error",
        description: "Could not get response from AI. Please try again.",
      });
      // Optionally remove the user message or add an error message to the chat
       setMessages((prevMessages) => prevMessages.slice(0, -1)); // Remove user message on error
    } finally {
      setIsChatLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
       <header className="flex items-center justify-between p-2 border-b border-border">
         {/* Placeholder for potential File/Edit menus or Title */}
         <div></div>
         {/* Action Buttons */}
         <div className="flex items-center">
           <Button onClick={executeCode} disabled={isRunning} variant="ghost" size="sm" className="text-accent hover:bg-accent/10 hover:text-accent mr-2">
             <Play className="mr-2 h-4 w-4" />
             {isRunning ? "Running..." : "Run"}
           </Button>
           <Button onClick={clearOutput} variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground mr-2">
             <Trash2 className="mr-2 h-4 w-4" />
             Clear Output
           </Button>
            <Button onClick={toggleChatPanel} variant="ghost" size="sm" className={`mr-2 ${isChatPanelOpen ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-muted/10'}`}>
             <MessageSquare className="mr-2 h-4 w-4" />
             Chat
           </Button>
         </div>
       </header>

      {/* Main Resizable Layout */}
       <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg">
         {/* Left Side: Editor and Output */}
         <ResizablePanel defaultSize={isChatPanelOpen ? 70 : 100}>
            <ResizablePanelGroup direction="vertical" className="flex-grow">
              <ResizablePanel defaultSize={60} minSize={20}>
                <CodeEditor code={code} setCode={setCode} />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border hover:bg-accent data-[resize-handle-active]:bg-accent transition-colors duration-200" />
              <ResizablePanel defaultSize={40} minSize={10}>
                <OutputPanel output={output} />
              </ResizablePanel>
            </ResizablePanelGroup>
         </ResizablePanel>

         {/* Optional Right Side: Chat Panel */}
         {isChatPanelOpen && (
           <>
             <ResizableHandle withHandle className="bg-border hover:bg-accent data-[resize-handle-active]:bg-accent transition-colors duration-200" />
             <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
               <ChatPanel
                 messages={messages}
                 onSendMessage={handleSendMessage}
                 isLoading={isChatLoading}
               />
             </ResizablePanel>
           </>
         )}
       </ResizablePanelGroup>
    </div>
  );
}
