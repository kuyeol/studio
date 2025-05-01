
'use client'

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
import PdfViewer from "./pdf-viewer"; // Import PdfViewer
import MarkdownViewer from "./markdown-viewer"; // Import MarkdownViewer
import { Button } from "@/components/ui/button";
import { Play, Trash2, Save,  File as FileIcon, Loader2, X, Menu, PanelBottom, Code, PanelRightOpen, PanelLeftOpen, FileText, FileType } from "lucide-react"; // Add FileType icon
import { chat, type Message, type ChatInput, type ChatOutput } from "@/ai/flows/chat-flow";
import { useToast } from "@/hooks/use-toast";
import { readFile, saveFile, uploadFile } from "@/services/file-api"; // Import file API functions & upload
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile hook
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"; // Import Sheet components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip

import dynamic from 'next/dynamic';



// Helper to determine file type
const getFileType = (fileName: string | null): 'code' | 'pdf' | 'markdown' | 'unknown' => {
  if (!fileName) return 'unknown';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (extension === 'md') return 'markdown';
  // Assume code for common script/markup extensions
  if (['js', 'ts', 'jsx', 'tsx', 'css', 'html', 'xml', 'json', 'java', 'py'].includes(extension || '')) return 'code'; // Added 'py'
  return 'unknown'; // Or handle other types like images, etc.
};


export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Select a file or start coding!");
  const [markdownContent, setMarkdownContent] = React.useState<string>(""); // State for Markdown content
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null); // State for PDF URL
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isSavingFile, setIsSavingFile] = React.useState(false);
  const [fileType, setFileType] = React.useState<'code' | 'pdf' | 'markdown' | 'unknown'>('unknown'); // State for file type

  // State for Chat
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile(); // Use the hook

  // State for mobile sheets
  const [isFileSheetOpen, setIsFileSheetOpen] = React.useState(false);
  const [isChatSheetOpen, setIsChatSheetOpen] = React.useState(false); // State for mobile chat sheet

  // State for panel visibility (Desktop only)
  const [isEditorVisible, setIsEditorVisible] = React.useState(true); // Combined Editor/PDF/Markdown view
  const [isChatVisible, setIsChatVisible] = React.useState(true);

  // State to track client-side mount to prevent hydration errors

  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {

    setHasMounted(true);
  
  }, []);

 

  // Dummy execution function - update relevance for non-code files
  const executeCode = async () => {
    if (fileType !== 'code') {
         toast({
            title: "Cannot Execute",
            description: "Execution is only available for code files.",
            variant: "destructive", // Use destructive variant for errors/warnings
         });
        return;
    }

    setIsRunning(true);
    setOutput([`Executing ${selectedFile ? `'${selectedFile}'` : 'code'}...`]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // In a real app, this would involve sending code to a backend execution environment
      console.log("Executing code:\n", code);
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
  const toggleEditorPdfVisibility = () => {
    if (!isChatVisible && isEditorVisible) return; // Prevent hiding the last panel
    setIsEditorVisible(!isEditorVisible);
  };

  const toggleChatVisibility = () => {
     if (!isEditorVisible && isChatVisible) return; // Prevent hiding the last panel
    setIsChatVisible(!isChatVisible);
  };


  // Function to handle selecting a file
  const handleSelectFile = async (fileName: string) => {
    if (isLoadingFile || isSavingFile) return;
    setIsLoadingFile(true);
    setSelectedFile(fileName);
    const type = getFileType(fileName);
    setFileType(type);
    setCode(type === 'code' ? `// Loading ${fileName}...` : ''); // Clear code editor unless it's a code file
    setMarkdownContent(type === 'markdown' ? `# Loading ${fileName}...` : ''); // Clear markdown viewer unless it's markdown
    setPdfUrl(null); // Clear previous PDF URL
    setIsFileSheetOpen(false); // Close mobile sheet if open

    try {
      const contentOrUrl = await readFile(fileName); // This now returns content or URL

      if (type === 'pdf') {
          // Ensure the content is a valid URL (basic check)
          if (typeof contentOrUrl === 'string' && (contentOrUrl.startsWith('http') || contentOrUrl.startsWith('/') || contentOrUrl.startsWith('data:application/pdf'))) {
            setPdfUrl(contentOrUrl);
            setOutput([`Loaded PDF: ${fileName}`]);
             toast({
                title: "PDF Loaded",
                description: `Successfully loaded ${fileName}.`,
            });
          } else {
             throw new Error("Invalid PDF URL or content received.");
          }
      } else if (type === 'code') {
         setCode(contentOrUrl);
         setOutput([`Loaded file: ${fileName}`]);
          toast({
            title: "File Loaded",
            description: `Successfully loaded ${fileName}.`,
          });
      } else if (type === 'markdown') {
         setMarkdownContent(contentOrUrl);
         setOutput([`Loaded Markdown: ${fileName}`]); // Clear output for markdown
         toast({
            title: "Markdown Loaded",
            description: `Successfully loaded ${fileName}.`,
          });
      } else {
         // Handle other unknown types if necessary
         setCode(`// Cannot display file type for ${fileName}`);
         setMarkdownContent(""); // Clear markdown content
         setOutput([`Loaded file with unknown type: ${fileName}`]);
         toast({
            title: "File Loaded",
            description: `Loaded ${fileName}, but preview is not supported for this type.`,
            variant: "default" // Use default variant for informational messages
         });
      }

    } catch (error: any) { // Added type annotation for error
      console.error("Error loading file:", error);
      setCode(`// Error loading ${fileName}\n// Please check the console for details.`);
      setPdfUrl(null); // Clear PDF URL on error
      setMarkdownContent(""); // Clear markdown content on error
      setFileType('unknown'); // Reset file type
      toast({
        variant: "destructive",
        title: "File Load Error",
        description: `Could not load ${fileName}. ${error?.message || 'Unknown error'}`, // Include error message
      });
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Function to handle saving the current file
  const handleSaveFile = async () => {
    // Saving is only enabled for 'code' files in this version
    if (!selectedFile || isSavingFile || isLoadingFile || fileType !== 'code') {
        if(fileType === 'pdf') {
             toast({
                title: "Cannot Save",
                description: "Saving PDF files directly is not supported.",
                variant: "destructive",
            });
        } else if(fileType === 'markdown') {
             toast({
                title: "Cannot Save",
                description: "Editing and saving Markdown files is not yet supported.",
                variant: "destructive",
            });
        } else if (fileType === 'unknown') {
             toast({
                title: "Cannot Save",
                description: "Cannot save file of unknown type.",
                variant: "destructive",
            });
        } else if (!selectedFile) {
             toast({
                title: "Cannot Save",
                description: "No file selected to save.",
                variant: "destructive",
            });
        }
        return;
    }
    setIsSavingFile(true);
    try {
      await saveFile(selectedFile, code); // Save code content
      setOutput([`Saved file: ${selectedFile}`]);
       toast({
        title: "File Saved",
        description: `${selectedFile} saved successfully.`,
      });
    } catch (error: any) { // Added type annotation for error
      console.error("Error saving file:", error);
       toast({
        variant: "destructive",
        title: "File Save Error",
        description: `Could not save ${selectedFile}. ${error?.message || 'Unknown error'}`, // Include error message
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
      const chatInput: ChatInput = {
        history: messages || [], // Ensure history is an array
        message: userMessage,
      };
      const result: ChatOutput = await chat(chatInput);
      const aiResponseMessage: Message = { role: "model", content: result.response };
      setMessages((prevMessages = []) => [...prevMessages, aiResponseMessage]);
    } catch (error: any) { // Added type annotation for error
      console.error("Error calling chat flow:", error);
      toast({
        variant: "destructive",
        title: "AI Chat Error",
        description: `Could not get response from AI. ${error?.message || 'Please try again.'}`, // Include error message
      });
      // Optional: remove the user message if the API call failed
       setMessages((prevMessages = []) => prevMessages.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

 // Renders the CodeEditor, PdfViewer, or MarkdownViewer based on fileType
 const renderEditorOrViewer = () => {
    if (isLoadingFile) {
      return (
        <div className="flex h-full items-center justify-center bg-card text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading file...
        </div>
      );
    }

    switch (fileType) {
      case 'code':
        // Pass disabled state to CodeEditor
        return <CodeEditor code={code} setCode={setCode} disabled={isSavingFile || isLoadingFile} />;
      case 'pdf':
        return <PdfViewer fileUrl={pdfUrl} />;
      case 'markdown':
        // Pass content to MarkdownViewer
        return <MarkdownViewer content={markdownContent} />;
      case 'unknown':
      default:
        return (
          <div className="flex h-full items-center justify-center bg-card text-muted-foreground p-4 text-center">
            {selectedFile
              ? `Preview for "${selectedFile}" is not available. Select a supported file type (.js, .ts, .css, .html, .md, .pdf, etc.).`
              : "Select a file from the browser or start coding."}
          </div>
        );
    }
  };


  const renderDesktopLayout = () => {
     const onlyEditorVisible = isEditorVisible && !isChatVisible;
     const onlyChatVisible = !isEditorVisible && isChatVisible;
     const bothVisible = isEditorVisible && isChatVisible;
     const neitherVisible = !isEditorVisible && !isChatVisible; // Should not happen due to toggle logic

     // Determine panel sizes dynamically
     let fileBrowserSize = 20; // Fixed size for file browser
     let editorPanelSize = 0;
     let chatPanelSize = 0;

     if (bothVisible) {
        // Calculate available space after file browser
        const remainingSpace = 100 - fileBrowserSize;
        editorPanelSize = remainingSpace * 0.6; // 60% of remaining space for editor/viewer/output
        chatPanelSize = remainingSpace * 0.4; // 40% of remaining space for chat
     } else if (onlyEditorVisible) {
         editorPanelSize = 100 - fileBrowserSize; // Takes all remaining space
     } else if (onlyChatVisible) {
         chatPanelSize = 100 - fileBrowserSize; // Takes all remaining space
     }

     return (
         <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border border-border">
             {/* Left Side: File Browser */}
             <ResizablePanel defaultSize={fileBrowserSize} minSize={15} maxSize={40}>
                 <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
             </ResizablePanel>
             <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />

             {/* Center: Editor/Viewer + Output OR Empty State */}
             {isEditorVisible && (
                 <ResizablePanel defaultSize={editorPanelSize} minSize={20}>
                      <ResizablePanelGroup direction="vertical" className="flex-grow h-full"> {/* Ensure full height */}
                          {/* Top: Editor, PDF Viewer, or Markdown Viewer */}
                          <ResizablePanel
                              defaultSize={fileType === 'code' ? 60 : 100} // Give more space if output panel isn't shown
                              minSize={20}
                              className="bg-card rounded-t-lg overflow-hidden"
                          >
                              {renderEditorOrViewer()}
                          </ResizablePanel>
                          {/* Bottom: Output Panel (Only shown for code files) */}
                          {fileType === 'code' && (
                              <>
                                  <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
                                  <ResizablePanel defaultSize={40} minSize={10}>
                                      <OutputPanel output={output} />
                                  </ResizablePanel>
                              </>
                          )}
                      </ResizablePanelGroup>
                 </ResizablePanel>
             )}

             {/* Separator if both panels are visible */}
             {bothVisible && (
                  <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
             )}


             {/* Right Side: Chat Panel OR Empty State */}
             {isChatVisible && (
                 <ResizablePanel defaultSize={chatPanelSize} minSize={20}>
                     <ChatPanel
                         messages={messages || []}
                         onSendMessage={handleSendMessage}
                         isLoading={isChatLoading}
                     />
                 </ResizablePanel>
             )}

            {/* This state should ideally not be reached if toggle logic is correct */}
            {neitherVisible && (
                 <ResizablePanel defaultSize={100 - fileBrowserSize}>
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                       <p>Toggle panels using the header buttons.</p>
                    </div>
                 </ResizablePanel>
             )}
         </ResizablePanelGroup>
     );
  };


  const renderMobileLayout = () => (
     <div className="flex flex-col h-full"> {/* Main container for mobile */}
        {/* Editor/Viewer Area */}
        <div className="flex-grow overflow-hidden border border-border rounded-lg mb-2">
            {renderEditorOrViewer()}
        </div>

         {/* Output Area (Only if code file type) */}
        {fileType === 'code' && (
            <div className="h-[30%] flex-shrink-0 border border-border rounded-lg mb-2 overflow-hidden">
               <OutputPanel output={output} />
            </div>
        )}

        {/* Mobile Chat Trigger (Remains at bottom) */}
        {/* Note: The actual chat panel is rendered inside the Sheet */}
     </div>
  );


  // Helper to get the correct file icon based on type
  const getCurrentFileIcon = () => {
      if (isLoadingFile) return <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />;
      if (!selectedFile) return null; // Or a default icon if needed

      switch (fileType) {
        case 'pdf':
            return <FileText className="h-4 w-4 flex-shrink-0" />;
        case 'markdown':
             return <FileType className="h-4 w-4 flex-shrink-0" />; // Using FileType for MD
        case 'code':
        default: // Includes 'unknown' and 'code'
             return <FileIcon className="h-4 w-4 flex-shrink-0" />;
      }
  };

  // Prevent rendering until mounted on the client to avoid hydration mismatch
   if (!hasMounted) {
    // Optionally return a loading skeleton or null during server render / initial mount
    return (
      <svg
      className="h-8 w-8 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
    );
   }


  return (
    <TooltipProvider delayDuration={100}>
       <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden p-2">
          {/* Header Section */}
          <header className="flex items-center justify-between p-2 border-b border-border flex-shrink-0 mb-2 bg-card rounded-lg shadow-sm">
            {/* Left Side: Mobile File Trigger / Desktop File Indicator */}
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                {isMobile && ( // Conditionally render File Browser Trigger
                   <Sheet open={isFileSheetOpen} onOpenChange={setIsFileSheetOpen}>
                    <SheetTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                         <PanelBottom className="h-5 w-5" /> {/* Icon for mobile file browser */}
                         <span className="sr-only">Open File Browser</span>
                       </Button>
                     </SheetTrigger>
                     <SheetContent side="bottom" className="w-full h-2/3 p-0 flex flex-col" >
                        <SheetHeader className="p-3 border-b border-border flex-shrink-0">
                           <SheetTitle>File Browser</SheetTitle>
                         </SheetHeader>
                       {/* File Browser inside the sheet */}
                       <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
                     </SheetContent>
                   </Sheet>
                )}
                 {/* File Indicator (Visible on both, but more prominent on desktop) */}
                 <div className="flex items-center gap-1 text-muted-foreground overflow-hidden">
                     {getCurrentFileIcon()} {/* Dynamic icon based on file type */}
                     {isLoadingFile ? (
                        <span className="truncate">Loading...</span>
                    ) : selectedFile ? (
                        // Show selected file name, tooltip on hover if truncated
                        <span className="font-medium text-foreground truncate" title={selectedFile}>{selectedFile}</span>
                    ) : (
                         <span className="truncate">No file selected</span>
                    )}
                 </div>
            </div>

            {/* Center: Desktop Visibility Controls */}
          
            {!isMobile && (
               <div className="flex items-center gap-1 border border-border rounded-md p-0.5 mx-4">
                  {/* Toggle Editor/Viewer Panel Button */}
                  <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                            onClick={toggleEditorPdfVisibility}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7",
                                isEditorVisible ? "text-primary bg-primary/10" : "text-muted-foreground",
                                !isChatVisible && "cursor-not-allowed opacity-50" // Disable if it's the only visible panel
                            )}
                            disabled={!isChatVisible && isEditorVisible} // Prevent hiding last panel
                         >
                            <PanelLeftOpen className="h-4 w-4" /> {/* Icon for editor/viewer panel */}
                            <span className="sr-only">Toggle Editor/Viewer</span>
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">
                        <p>{isEditorVisible ? "Hide" : "Show"} Editor/Viewer & Output</p>
                     </TooltipContent>
                  </Tooltip>
                  {/* Toggle Chat Panel Button */}
                   <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                            onClick={toggleChatVisibility}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7",
                                isChatVisible ? "text-primary bg-primary/10" : "text-muted-foreground",
                                 !isEditorVisible && "cursor-not-allowed opacity-50" // Disable if it's the only visible panel
                            )}
                             disabled={!isEditorVisible && isChatVisible} // Prevent hiding last panel
                         >
                            <PanelRightOpen className="h-4 w-4" /> {/* Icon for chat panel */}
                             <span className="sr-only">Toggle Chat Panel</span>
                         </Button>
                     </TooltipTrigger>
                      <TooltipContent side="bottom">
                         <p>{isChatVisible ? "Hide" : "Show"} Chat</p>
                      </TooltipContent>
                   </Tooltip>
               </div>
            )}


            {/* Right Side: Action Buttons (Save, Run, Clear) + Mobile Chat Trigger */}
            <div className="flex items-center gap-1">
                {isMobile ? (
                   // Dropdown menu for actions on mobile + Chat Trigger Button
                   <>
                       {/* Chat Trigger Button */}
                        <Sheet open={isChatSheetOpen} onOpenChange={setIsChatSheetOpen}>
                            <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg> {/* Simple chat bubble icon */}
                                <span className="sr-only">Open Chat</span>
                            </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="w-full h-4/5 p-0 flex flex-col"> {/* Taller sheet */}
                               {/* Chat Panel inside the sheet */}
                               <ChatPanel
                                messages={messages || []}
                                onSendMessage={handleSendMessage}
                                isLoading={isChatLoading}
                               />
                            </SheetContent>
                        </Sheet>

                       {/* Actions Dropdown */}
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <Menu className="h-5 w-5" /> {/* Hamburger menu icon */}
                             <span className="sr-only">More actions</span>
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           {/* Save Action */}
                           <DropdownMenuItem
                             onClick={handleSaveFile}
                             disabled={!selectedFile || isSavingFile || isLoadingFile || fileType !== 'code'} // Only enable save for code files
                           >
                             {isSavingFile ? (
                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             ) : (
                               <Save className="mr-2 h-4 w-4 text-primary" />
                             )}
                             {isSavingFile ? "Saving..." : "Save Code"}
                           </DropdownMenuItem>
                           {/* Run Action */}
                           <DropdownMenuItem
                             onClick={executeCode}
                             disabled={isRunning || isLoadingFile || isSavingFile || fileType !== 'code'} // Only enable run for code files
                           >
                             {isRunning ? (
                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             ) : (
                               <Play className="mr-2 h-4 w-4 text-primary" />
                             )}
                             {isRunning ? "Running..." : "Run Code"}
                           </DropdownMenuItem>
                            {/* Clear Output Action */}
                           <DropdownMenuItem onClick={clearOutput} disabled={fileType !== 'code'}> {/* Only enable clear for code files */}
                             <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                             Clear Output
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                   </>

                ) : (
                   // Individual buttons with tooltips for actions on desktop
                   <>
                      {/* Save Button */}
                      <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                               onClick={handleSaveFile}
                               disabled={!selectedFile || isSavingFile || isLoadingFile || fileType !== 'code'} // Only enable save for code files
                               variant="ghost"
                               size="icon"
                               className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8"
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
                             <p>Save File ({selectedFile || 'No file'}) {fileType !== 'code' ? '(Code files only)' : ''}</p>
                          </TooltipContent>
                      </Tooltip>

                       {/* Run Button */}
                       <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                               onClick={executeCode}
                               disabled={isRunning || isLoadingFile || isSavingFile || fileType !== 'code'} // Only enable run for code files
                               variant="ghost"
                               size="icon"
                                className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8"
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
                            <p>Run Code {fileType !== 'code' ? '(Code files only)' : ''}</p>
                          </TooltipContent>
                       </Tooltip>

                       {/* Clear Output Button */}
                       <Tooltip>
                          <TooltipTrigger asChild>
                              <Button onClick={clearOutput} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground h-8 w-8" disabled={fileType !== 'code'}> {/* Only enable clear for code files */}
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Clear Output</span>
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                             <p>Clear Output {fileType !== 'code' ? '(Code files only)' : ''}</p>
                          </TooltipContent>
                       </Tooltip>
                   </>
                )}
            </div>
          </header>

         {/* Main Layout Area (renders mobile or desktop layout) */}
          {isMobile ? renderMobileLayout() : renderDesktopLayout()}

       </div>
    </TooltipProvider>
  );
}
