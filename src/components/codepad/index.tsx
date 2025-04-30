
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
import { Play, Trash2, MessageSquare, Save, Loader2, File as FileIcon, PanelLeft, X, Menu, PanelBottom, Code, PanelRightOpen, PanelLeftOpen } from "lucide-react"; // Add Code, PanelRightOpen, PanelLeftOpen
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip


export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Select a file or start coding!");
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isSavingFile, setIsSavingFile] = React.useState(false);

  // State for Chat
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile(); // Use the hook

  // State for mobile sheets
  const [isFileSheetOpen, setIsFileSheetOpen] = React.useState(false);

  // State for panel visibility (Desktop only)
  const [isEditorVisible, setIsEditorVisible] = React.useState(true);
  const [isChatVisible, setIsChatVisible] = React.useState(true); // Keep chat visible by default

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

  // Toggle functions for desktop panel visibility
  const toggleEditorVisibility = () => {
     // Prevent hiding both panels
    if (!isChatVisible && isEditorVisible) return;
    setIsEditorVisible(!isEditorVisible);
  };

  const toggleChatVisibility = () => {
     // Prevent hiding both panels
     if (!isEditorVisible && isChatVisible) return;
    setIsChatVisible(!isChatVisible);
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

  const renderDesktopLayout = () => {
     const onlyEditorVisible = isEditorVisible && !isChatVisible;
     const onlyChatVisible = !isEditorVisible && isChatVisible;
     const bothVisible = isEditorVisible && isChatVisible;
     const neitherVisible = !isEditorVisible && !isChatVisible; // Should not happen due to toggle logic

     // Calculate panel sizes dynamically
     let fileBrowserSize = 20;
     let editorPanelSize = 0;
     let chatPanelSize = 0;

     if (bothVisible) {
        editorPanelSize = 50;
        chatPanelSize = 30;
     } else if (onlyEditorVisible) {
         editorPanelSize = 80; // Takes remaining space
     } else if (onlyChatVisible) {
         chatPanelSize = 80; // Takes remaining space
     } else {
        // Fallback if somehow both are hidden (e.g., initial state before enforcement)
        // Or display a message? For now, make editor take space.
         editorPanelSize = 80;
     }


     return (
         <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border border-border">
             {/* Left Side: File Browser */}
             <ResizablePanel defaultSize={fileBrowserSize} minSize={15} maxSize={40}>
                 <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
             </ResizablePanel>

             {/* Editor Panel (Conditional) */}
             {isEditorVisible && (
                 <>
                    <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
                    <ResizablePanel defaultSize={onlyEditorVisible ? 100 - fileBrowserSize : editorPanelSize} minSize={15}>
                        <ResizablePanelGroup direction="vertical" className="flex-grow">
                            <ResizablePanel defaultSize={60} minSize={20} className="bg-card rounded-t-lg">
                                <CodeEditor code={code} setCode={setCode} disabled={isLoadingFile || isSavingFile} />
                            </ResizablePanel>
                            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
                            <ResizablePanel defaultSize={40} minSize={10}>
                                <OutputPanel output={output} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                 </>
             )}


             {/* Chat Panel (Conditional) */}
             {isChatVisible && (
                 <>
                     {/* Show handle only if editor is also visible */}
                     {isEditorVisible && <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />}
                     {/* If editor is hidden, add handle before chat */}
                     {!isEditorVisible && <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />}
                     <ResizablePanel defaultSize={onlyChatVisible ? 100 - fileBrowserSize : chatPanelSize} minSize={15}> {/* Removed maxSize={50} */}
                         <ChatPanel
                             messages={messages || []}
                             onSendMessage={handleSendMessage}
                             isLoading={isChatLoading}
                         />
                     </ResizablePanel>
                 </>
             )}

            {/* Placeholder if both are hidden? */}
            {neitherVisible && (
                 <>
                 <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
                 <ResizablePanel defaultSize={80}>
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                       <p>Editor and Chat are hidden.</p>
                    </div>
                 </ResizablePanel>
                 </>
             )}
         </ResizablePanelGroup>
     );
  };


  const renderMobileLayout = () => (
     // Use ResizablePanelGroup for vertical resizing on mobile
    <ResizablePanelGroup
      direction="vertical"
      className="flex-grow rounded-lg border border-border overflow-hidden"
    >
      {/* Top Panel: Editor + Output (Resizable internally) */}
      <ResizablePanel defaultSize={50} minSize={20}>
          <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={60} minSize={20} className="bg-card">
                  <CodeEditor code={code} setCode={setCode} disabled={isLoadingFile || isSavingFile} />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
              <ResizablePanel defaultSize={40} minSize={10}>
                  <OutputPanel output={output} />
              </ResizablePanel>
          </ResizablePanelGroup>
      </ResizablePanel>

      {/* Handle */}
      <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />

       {/* Bottom Panel: Chat */}
      <ResizablePanel defaultSize={50} minSize={20}>
          <ChatPanel
            messages={messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    // Wrap with TooltipProvider for desktop buttons
    <TooltipProvider delayDuration={100}>
       <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden p-2"> {/* Added padding to body */}
          <header className="flex items-center justify-between p-2 border-b border-border flex-shrink-0 mb-2 bg-card rounded-lg shadow-sm"> {/* Header gets card bg, rounded, shadow */}
            {/* Left Side: Mobile File Trigger / Desktop File Indicator */}
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1"> {/* Allow flex-1 for file indicator */}
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
                        <SheetHeader className="p-3 border-b border-border flex-shrink-0"> {/* Added header */}
                           <SheetTitle>File Browser</SheetTitle>
                         </SheetHeader>
                       <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
                     </SheetContent>
                   </Sheet>
                ) : null}
                {/* Current File Indicator (Desktop & Mobile) */}
                 <div className="flex items-center gap-1 text-muted-foreground overflow-hidden"> {/* Added overflow-hidden */}
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

            {/* Center: Desktop Visibility Controls */}
            {!isMobile && (
               <div className="flex items-center gap-1 border border-border rounded-md p-0.5 mx-4">
                  <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                            onClick={toggleEditorVisibility}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7",
                                isEditorVisible ? "text-primary bg-primary/10" : "text-muted-foreground"
                            )}
                            disabled={!isChatVisible && isEditorVisible} // Prevent disabling the last visible panel
                         >
                            <PanelLeftOpen className="h-4 w-4" />
                            <span className="sr-only">Toggle Editor/Output</span>
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">
                        <p>{isEditorVisible ? "Hide" : "Show"} Editor & Output</p>
                     </TooltipContent>
                  </Tooltip>
                   <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                            onClick={toggleChatVisibility}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7",
                                isChatVisible ? "text-primary bg-primary/10" : "text-muted-foreground"
                            )}
                             disabled={!isEditorVisible && isChatVisible} // Prevent disabling the last visible panel
                         >
                            <PanelRightOpen className="h-4 w-4" />
                             <span className="sr-only">Toggle Chat Panel</span>
                         </Button>
                     </TooltipTrigger>
                      <TooltipContent side="bottom">
                         <p>{isChatVisible ? "Hide" : "Show"} Chat</p>
                      </TooltipContent>
                   </Tooltip>
               </div>
            )}


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
                     </DropdownMenuContent>
                   </DropdownMenu>

                ) : (
                   <>
                      <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                               onClick={handleSaveFile}
                               disabled={!selectedFile || isSavingFile || isLoadingFile}
                               variant="ghost"
                               size="icon" // Changed to icon
                               className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8" // Use primary color
                            >
                               {isSavingFile ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                   <Save className="h-4 w-4" />
                               )}
                               <span className="sr-only">{isSavingFile ? "Saving..." : "Save"}</span>
                            </Button>
                         </TooltipTrigger>
                          <TooltipContent side="bottom">
                             <p>Save File ({selectedFile || 'No file'})</p>
                          </TooltipContent>
                      </Tooltip>

                       <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                               onClick={executeCode}
                               disabled={isRunning || isLoadingFile || isSavingFile}
                               variant="ghost"
                               size="icon" // Changed to icon
                                className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8" // Use primary color
                            >
                               {isRunning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                   <Play className="h-4 w-4" />
                               )}
                                <span className="sr-only">{isRunning ? "Running..." : "Run"}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Run Code</p>
                          </TooltipContent>
                       </Tooltip>

                       <Tooltip>
                          <TooltipTrigger asChild>
                              <Button onClick={clearOutput} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground h-8 w-8">
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Clear Output</span>
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                             <p>Clear Output</p>
                          </TooltipContent>
                       </Tooltip>
                       {/* Removed chat toggle button from here, moved to center */}
                   </>
                )}
            </div>
          </header>

         {/* Main Layout */}
          {isMobile ? renderMobileLayout() : renderDesktopLayout()}

       </div>
    </TooltipProvider>
  );
}
