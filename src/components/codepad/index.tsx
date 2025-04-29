
"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeEditor from "./code-editor";
import OutputPanel from "./output-panel";
import ChatPanel from "./chat-panel";
import FileBrowser from "./file-browser"; // Import FileBrowser
import { Button } from "@/components/ui/button";
import { Play, Trash2, MessageSquare, Save, Loader2, File as FileIcon } from "lucide-react"; // Add Save, Loader2, FileIcon
import { chat, type Message, type ChatInput, type ChatOutput } from "@/ai/flows/chat-flow";
import { useToast } from "@/hooks/use-toast";
import { readFile, saveFile } from "@/services/file-api"; // Import file API functions

export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Select a file or start coding!");
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isSavingFile, setIsSavingFile] = React.useState(false);

  // State for Chat
  const [isChatPanelOpen, setIsChatPanelOpen] = React.useState(true);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const { toast } = useToast();

  // Dummy execution function - replace with actual backend call
  const executeCode = async () => {
    setIsRunning(true);
    setOutput([`Executing ${selectedFile ? `'${selectedFile}'` : 'code'}...`]);

    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // In a real scenario, this would be an API call to a backend service
      // that safely executes the Node.js code in a sandboxed environment.
      // For this frontend demo, we'll just log the code.
      console.log("Executing code:\n", code);
       // Simulate output based on code - very basic example
      let simulatedOutput = `Simulated execution of ${selectedFile ? `'${selectedFile}'` : 'unsaved code'} complete.`;
      if (code.includes("console.log('Hello, CodePad!')")) {
         simulatedOutput += "\nHello, CodePad!";
      }
      setOutput([simulatedOutput]);
    } catch (error: any) {
      setOutput([`Error during execution: ${error.message}`]);
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

  // Function to handle selecting a file
  const handleSelectFile = async (fileName: string) => {
    if (isLoadingFile || isSavingFile) return; // Prevent selection while loading/saving
    setIsLoadingFile(true);
    setSelectedFile(fileName);
    setCode(`// Loading ${fileName}...`);
    try {
      const content = await readFile(fileName);
      setCode(content);
      setOutput([`Loaded file: ${fileName}`]);
       toast({
        title: "File Loaded",
        description: `Successfully loaded ${fileName}.`,
      });
    } catch (error) {
      console.error("Error loading file:", error);
      setCode(`// Error loading ${fileName}\n// Please check the console for details.`);
      setSelectedFile(null); // Reset selection on error
      toast({
        variant: "destructive",
        title: "File Load Error",
        description: `Could not load ${fileName}. See console for details.`,
      });
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Function to handle saving the current file
  const handleSaveFile = async () => {
    if (!selectedFile || isSavingFile || isLoadingFile) return;
    setIsSavingFile(true);
    try {
      await saveFile(selectedFile, code);
      setOutput([`Saved file: ${selectedFile}`]);
       toast({
        title: "File Saved",
        description: `${selectedFile} saved successfully.`,
      });
    } catch (error) {
      console.error("Error saving file:", error);
       toast({
        variant: "destructive",
        title: "File Save Error",
        description: `Could not save ${selectedFile}. See console for details.`,
      });
    } finally {
      setIsSavingFile(false);
    }
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
          {/* Left Side: Current File Indicator */}
         <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            {isLoadingFile ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                </>
            ) : selectedFile ? (
                <>
                    <FileIcon className="h-4 w-4" />
                    <span className="font-medium text-foreground truncate" title={selectedFile}>{selectedFile}</span>
                </>
            ) : (
                 <span>No file selected</span>
            )}
         </div>

         {/* Right Side: Action Buttons */}
         <div className="flex items-center">
            <Button
             onClick={handleSaveFile}
             disabled={!selectedFile || isSavingFile || isLoadingFile}
             variant="ghost"
             size="sm"
             className="text-accent hover:bg-accent/10 hover:text-accent mr-2"
            >
             {isSavingFile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : (
                 <Save className="mr-2 h-4 w-4" />
             )}
             {isSavingFile ? "Saving..." : "Save"}
            </Button>
            <Button
             onClick={executeCode}
             disabled={isRunning || isLoadingFile || isSavingFile}
             variant="ghost"
             size="sm"
             className="text-accent hover:bg-accent/10 hover:text-accent mr-2"
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : (
                 <Play className="mr-2 h-4 w-4" />
             )}
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

          {/* Left Side: File Browser */}
           <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
           </ResizablePanel>
           <ResizableHandle withHandle className="bg-border hover:bg-accent data-[resize-handle-active]:bg-accent transition-colors duration-200" />


         {/* Center: Editor and Output */}
         <ResizablePanel defaultSize={isChatPanelOpen ? 50 : 80}>
            <ResizablePanelGroup direction="vertical" className="flex-grow">
              <ResizablePanel defaultSize={60} minSize={20}>
                <CodeEditor code={code} setCode={setCode} disabled={isLoadingFile || isSavingFile} />
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
