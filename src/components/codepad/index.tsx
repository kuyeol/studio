
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
import { Play, Trash2, MessageSquare, Save, Loader2, File as FileIcon, PanelLeft, X, Menu, PanelBottom } from "lucide-react"; // Add Save, Loader2, FileIcon, PanelLeft, X, Menu, PanelBottom
import { chat, type Message, type ChatInput, type ChatOutput } from "@/ai/flows/chat-flow";
import { useToast } from "@/hooks/use-toast";
import { readFile, saveFile } from "@/services/file-api"; // Import file API functions
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile hook
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"; // Import Sheet components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import { cn } from "@/lib/utils";


export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Select a file or start coding!");
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isSavingFile, setIsSavingFile] = React.useState(false);

  // State for Chat
  const [isDesktopChatPanelOpen, setIsDesktopChatPanelOpen] = React.useState(true); // Renamed for clarity
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile(); // Use the hook

  // State for mobile sheets
  const [isFileSheetOpen, setIsFileSheetOpen] = React.useState(false);
  const [isChatSheetOpen, setIsChatSheetOpen] = React.useState(false); // State for mobile chat sheet

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

  const toggleDesktopChatPanel = () => {
    setIsDesktopChatPanelOpen(!isDesktopChatPanelOpen);
  };

  // Function to handle selecting a file
  const handleSelectFile = async (fileName: string) => {
    if (isLoadingFile || isSavingFile) return; // Prevent selection while loading/saving
    setIsLoadingFile(true);
    setSelectedFile(fileName);
    setCode(`// Loading ${fileName}...`);
    setIsFileSheetOpen(false); // Close sheet on selection (mobile)
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
    setMessages((prevMessages = []) => [...prevMessages, newUserMessage]); // Ensure prevMessages is an array
    setIsChatLoading(true);

    try {
      // Prepare input for the chat flow
      const chatInput: ChatInput = {
        history: messages || [], // Pass the current history, default to empty array
        message: userMessage,
      };

      // Call the Genkit flow
      const result: ChatOutput = await chat(chatInput);

      const aiResponseMessage: Message = { role: "model", content: result.response };
      setMessages((prevMessages = []) => [...prevMessages, aiResponseMessage]); // Ensure prevMessages is an array

    } catch (error) {
      console.error("Error calling chat flow:", error);
      toast({
        variant: "destructive",
        title: "AI Chat Error",
        description: "Could not get response from AI. Please try again.",
      });
      // Optionally remove the user message or add an error message to the chat
       setMessages((prevMessages = []) => prevMessages.slice(0, -1)); // Ensure prevMessages is an array
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderDesktopLayout = () => (
     <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border border-border">
        {/* Left Side: File Browser */}
         <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
         </ResizablePanel>
         <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />

       {/* Center: Editor and Output */}
       <ResizablePanel defaultSize={isDesktopChatPanelOpen ? 50 : 80}>
          <ResizablePanelGroup direction="vertical" className="flex-grow">
            <ResizablePanel defaultSize={60} minSize={20} className="bg-card rounded-t-lg"> {/* Editor panel gets card background */}
              <CodeEditor code={code} setCode={setCode} disabled={isLoadingFile || isSavingFile} />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
            <ResizablePanel defaultSize={40} minSize={10}>
              <OutputPanel output={output} />
            </ResizablePanel>
          </ResizablePanelGroup>
       </ResizablePanel>

       {/* Optional Right Side: Chat Panel */}
       {isDesktopChatPanelOpen && (
         <>
           <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
           <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
             <ChatPanel
               messages={messages || []} // Pass messages or empty array
               onSendMessage={handleSendMessage}
               isLoading={isChatLoading}
             />
           </ResizablePanel>
         </>
       )}
     </ResizablePanelGroup>
  );

  const renderMobileLayout = () => (
    <div className="flex-grow flex flex-col border border-border rounded-lg overflow-hidden"> {/* Added border and rounded */}
      {/* Editor takes most space */}
      <div className="flex-grow-[6] min-h-0 bg-card"> {/* Editor panel gets card background */}
          <CodeEditor code={code} setCode={setCode} disabled={isLoadingFile || isSavingFile} />
      </div>
      {/* Output panel below */}
      <div className="flex-grow-[4] min-h-0 border-t border-border">
          <OutputPanel output={output} />
      </div>
      {/* Chat panel is now rendered in a Sheet below */}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden p-2"> {/* Added padding to body */}
       <header className="flex items-center justify-between p-2 border-b border-border flex-shrink-0 mb-2 bg-card rounded-lg shadow-sm"> {/* Header gets card bg, rounded, shadow */}
         {/* Left Side: Mobile File Trigger / Desktop File Indicator */}
         <div className="flex items-center gap-2 text-sm min-w-0">
            {isMobile ? (
               <Sheet open={isFileSheetOpen} onOpenChange={setIsFileSheetOpen}>
                <SheetTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                     <PanelBottom className="h-5 w-5" /> {/* Changed Icon */}
                     <span className="sr-only">Open File Browser</span>
                   </Button>
                 </SheetTrigger>
                 {/* Ensure SheetContent has appropriate styling */}
                 <SheetContent side="bottom" className="w-full h-2/3 p-0 flex flex-col" >
                   {/* Add accessible title */}
                    <SheetHeader className="sr-only">
                       <SheetTitle>File Browser</SheetTitle>
                     </SheetHeader>
                   <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
                 </SheetContent>
               </Sheet>
            ) : null}
            {/* Current File Indicator (Desktop & Mobile) */}
             <div className={cn("flex items-center gap-1 text-muted-foreground", isMobile && "flex-1")}>
                 {isLoadingFile ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        <span className="truncate">Loading...</span>
                    </>
                ) : selectedFile ? (
                    <>
                        <FileIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-foreground truncate" title={selectedFile}>{selectedFile}</span>
                    </>
                ) : (
                     <span className="truncate">No file selected</span>
                )}
             </div>
         </div>

         {/* Right Side: Action Buttons */}
         <div className="flex items-center gap-1">
            {isMobile ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                     <Menu className="h-5 w-5" />
                     <span className="sr-only">More actions</span>
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem
                     onClick={handleSaveFile}
                     disabled={!selectedFile || isSavingFile || isLoadingFile}
                   >
                     {isSavingFile ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       <Save className="mr-2 h-4 w-4 text-primary" /> // Icon color
                     )}
                     {isSavingFile ? "Saving..." : "Save"}
                   </DropdownMenuItem>
                   <DropdownMenuItem
                     onClick={executeCode}
                     disabled={isRunning || isLoadingFile || isSavingFile}
                   >
                     {isRunning ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       <Play className="mr-2 h-4 w-4 text-primary" /> // Icon color
                     )}
                     {isRunning ? "Running..." : "Run"}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={clearOutput}>
                     <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" /> // Icon color
                     Clear Output
                   </DropdownMenuItem>
                   {/* Trigger for Chat Sheet */}
                   <DropdownMenuItem onSelect={() => setIsChatSheetOpen(true)}>
                       <MessageSquare className="mr-2 h-4 w-4" />
                       Chat with AI
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>

            ) : (
               <>
                  <Button
                   onClick={handleSaveFile}
                   disabled={!selectedFile || isSavingFile || isLoadingFile}
                   variant="ghost"
                   size="sm"
                   className="text-primary hover:bg-primary/10 hover:text-primary" // Use primary color
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
                    className="text-primary hover:bg-primary/10 hover:text-primary" // Use primary color
                  >
                    {isRunning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   ) : (
                       <Play className="mr-2 h-4 w-4" />
                   )}
                   {isRunning ? "Running..." : "Run"}
                 </Button>
                  <Button onClick={clearOutput} variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground">
                   <Trash2 className="mr-2 h-4 w-4" />
                   Clear Output
                 </Button>
                  <Button onClick={toggleDesktopChatPanel} variant="ghost" size="sm" className={cn(
                      'hover:bg-muted/10', // Consistent hover
                      isDesktopChatPanelOpen
                        ? 'text-primary hover:text-primary bg-primary/10' // Active state with primary color
                        : 'text-muted-foreground hover:text-muted-foreground' // Inactive state
                    )}>
                   <MessageSquare className="mr-2 h-4 w-4" />
                   Chat
                 </Button>
               </>
            )}
         </div>
       </header>

      {/* Main Layout */}
       {isMobile ? renderMobileLayout() : renderDesktopLayout()}

        {/* Mobile Chat Sheet - Changed side and height */}
        {isMobile && (
            <Sheet open={isChatSheetOpen} onOpenChange={setIsChatSheetOpen}>
                 {/* SheetContent now renders the ChatPanel */}
                 <SheetContent side="bottom" className="w-full h-4/5 p-0 flex flex-col">
                      {/* Add accessible title */}
                      <SheetHeader className="sr-only">
                        <SheetTitle>AI Assistant Chat</SheetTitle>
                      </SheetHeader>
                     <ChatPanel
                        messages={messages || []} // Pass messages or empty array
                        onSendMessage={handleSendMessage}
                        isLoading={isChatLoading}
                      />
                 </SheetContent>
            </Sheet>
        )}
    </div>
  );
}

