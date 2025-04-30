
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
import PdfViewer from "./pdf-viewer"; // Import PdfViewer
import { Button } from "@/components/ui/button";
import { Play, Trash2, Save, Loader2, File as FileIcon, PanelLeft, X, Menu, PanelBottom, Code, PanelRightOpen, PanelLeftOpen, FileText } from "lucide-react"; // Add Code, PanelRightOpen, PanelLeftOpen, FileText
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
} from "@/components/ui/sheet"; // Import Sheet components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip
import { pdfjs } from 'react-pdf';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();


// Helper to determine file type
const getFileType = (fileName: string | null): 'code' | 'pdf' | 'unknown' => {
  if (!fileName) return 'unknown';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  // Assume code for common script/markup extensions
  if (['js', 'ts', 'jsx', 'tsx', 'css', 'html', 'xml', 'md', 'json', 'java'].includes(extension || '')) return 'code';
  return 'unknown'; // Or handle other types like images, etc.
};


export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Select a file or start coding!");
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null); // State for PDF URL
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isSavingFile, setIsSavingFile] = React.useState(false);
  const [fileType, setFileType] = React.useState<'code' | 'pdf' | 'unknown'>('unknown'); // State for file type

  // State for Chat
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile(); // Use the hook

  // State for mobile sheets
  const [isFileSheetOpen, setIsFileSheetOpen] = React.useState(false);

  // State for panel visibility (Desktop only)
  const [isEditorVisible, setIsEditorVisible] = React.useState(true); // Combined Editor/PDF view
  const [isChatVisible, setIsChatVisible] = React.useState(true);

  // Dummy execution function - update relevance for PDFs
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
    if (!isChatVisible && isEditorVisible) return;
    setIsEditorVisible(!isEditorVisible);
  };

  const toggleChatVisibility = () => {
     if (!isEditorVisible && isChatVisible) return;
    setIsChatVisible(!isChatVisible);
  };


  // Function to handle selecting a file
  const handleSelectFile = async (fileName: string) => {
    if (isLoadingFile || isSavingFile) return;
    setIsLoadingFile(true);
    setSelectedFile(fileName);
    const type = getFileType(fileName);
    setFileType(type);
    setCode(type === 'code' ? `// Loading ${fileName}...` : ''); // Clear code for non-code files
    setPdfUrl(null); // Clear previous PDF URL
    setIsFileSheetOpen(false);

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
      } else {
         // Handle other unknown types if necessary
         setCode(`// Cannot display file type for ${fileName}`);
         setOutput([`Loaded file with unknown type: ${fileName}`]);
         toast({
            title: "File Loaded",
            description: `Loaded ${fileName}, but preview is not supported for this type.`,
            variant: "default" // Use default variant for informational messages
         });
      }

    } catch (error) {
      console.error("Error loading file:", error);
      setCode(`// Error loading ${fileName}\n// Please check the console for details.`);
      setPdfUrl(null); // Clear PDF URL on error
      setSelectedFile(null); // Reset selection on error
      setFileType('unknown'); // Reset file type
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
    if (!selectedFile || isSavingFile || isLoadingFile || fileType === 'pdf') { // Disable saving for PDF
        if(fileType === 'pdf') {
             toast({
                title: "Cannot Save",
                description: "Saving PDF files directly is not supported.",
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
      const chatInput: ChatInput = {
        history: messages || [],
        message: userMessage,
      };
      const result: ChatOutput = await chat(chatInput);
      const aiResponseMessage: Message = { role: "model", content: result.response };
      setMessages((prevMessages = []) => [...prevMessages, aiResponseMessage]);
    } catch (error) {
      console.error("Error calling chat flow:", error);
      toast({
        variant: "destructive",
        title: "AI Chat Error",
        description: "Could not get response from AI. Please try again.",
      });
       setMessages((prevMessages = []) => prevMessages.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

 // Renders the CodeEditor or PdfViewer based on fileType
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
        return <CodeEditor code={code} setCode={setCode} disabled={isSavingFile} />;
      case 'pdf':
        return <PdfViewer fileUrl={pdfUrl} />;
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
     const neitherVisible = !isEditorVisible && !isChatVisible;

     let fileBrowserSize = 20;
     let editorPanelSize = 0;
     let chatPanelSize = 0;

     if (bothVisible) {
        editorPanelSize = 50; // Editor/PDF panel
        chatPanelSize = 30;
     } else if (onlyEditorVisible) {
         editorPanelSize = 80;
     } else if (onlyChatVisible) {
         chatPanelSize = 80;
     } else {
         editorPanelSize = 80;
     }


     return (
         <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border border-border">
             {/* Left Side: File Browser */}
             <ResizablePanel defaultSize={fileBrowserSize} minSize={15} maxSize={40}>
                 <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
             </ResizablePanel>

             {/* Editor/PDF Panel (Conditional) */}
             {isEditorVisible && (
                 <>
                    <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
                    <ResizablePanel defaultSize={onlyEditorVisible ? 100 - fileBrowserSize : editorPanelSize} minSize={15}>
                        <ResizablePanelGroup direction="vertical" className="flex-grow">
                            {/* Top: Editor or PDF Viewer */}
                            <ResizablePanel defaultSize={60} minSize={20} className="bg-card rounded-t-lg overflow-hidden">
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
                 </>
             )}


             {/* Chat Panel (Conditional) */}
             {isChatVisible && (
                 <>
                     {isEditorVisible && <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />}
                     {!isEditorVisible && <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />}
                     <ResizablePanel defaultSize={onlyChatVisible ? 100 - fileBrowserSize : chatPanelSize} minSize={15}>
                         <ChatPanel
                             messages={messages || []}
                             onSendMessage={handleSendMessage}
                             isLoading={isChatLoading}
                         />
                     </ResizablePanel>
                 </>
             )}

            {neitherVisible && (
                 <>
                 <ResizableHandle withHandle className="bg-border hover:bg-primary/20 data-[resize-handle-active]:bg-primary/30 transition-colors duration-200" />
                 <ResizablePanel defaultSize={80}>
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                       <p>Editor/Viewer and Chat are hidden.</p>
                    </div>
                 </ResizablePanel>
                 </>
             )}
         </ResizablePanelGroup>
     );
  };


  const renderMobileLayout = () => (
    <ResizablePanelGroup
      direction="vertical"
      className="flex-grow rounded-lg border border-border overflow-hidden"
    >
      {/* Top Panel: Editor/Viewer + Output (Resizable internally) */}
      <ResizablePanel defaultSize={50} minSize={20}>
          <ResizablePanelGroup direction="vertical" className="h-full">
               {/* Top: Editor or PDF Viewer */}
              <ResizablePanel defaultSize={fileType === 'code' ? 60 : 100} minSize={20} className="bg-card overflow-hidden">
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

  // Helper to get the correct file icon
  const getCurrentFileIcon = () => {
      if (isLoadingFile) return <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />;
      if (!selectedFile) return null; // Or a default icon if needed

      return fileType === 'pdf'
          ? <FileText className="h-4 w-4 flex-shrink-0" />
          : <FileIcon className="h-4 w-4 flex-shrink-0" />;
  };


  return (
    <TooltipProvider delayDuration={100}>
       <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden p-2">
          <header className="flex items-center justify-between p-2 border-b border-border flex-shrink-0 mb-2 bg-card rounded-lg shadow-sm">
            {/* Left Side: Mobile File Trigger / Desktop File Indicator */}
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                {isMobile ? (
                   <Sheet open={isFileSheetOpen} onOpenChange={setIsFileSheetOpen}>
                    <SheetTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                         <PanelBottom className="h-5 w-5" />
                         <span className="sr-only">Open File Browser</span>
                       </Button>
                     </SheetTrigger>
                     <SheetContent side="bottom" className="w-full h-2/3 p-0 flex flex-col" >
                        <SheetHeader className="p-3 border-b border-border flex-shrink-0">
                           <SheetTitle>File Browser</SheetTitle>
                         </SheetHeader>
                       <FileBrowser onSelectFile={handleSelectFile} selectedFile={selectedFile} />
                     </SheetContent>
                   </Sheet>
                ) : null}
                 <div className="flex items-center gap-1 text-muted-foreground overflow-hidden">
                     {getCurrentFileIcon()}
                     {isLoadingFile ? (
                        <span className="truncate">Loading...</span>
                    ) : selectedFile ? (
                        <span className="font-medium text-foreground truncate" title={selectedFile}>{selectedFile}</span>
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
                            onClick={toggleEditorPdfVisibility}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7",
                                isEditorVisible ? "text-primary bg-primary/10" : "text-muted-foreground"
                            )}
                            disabled={!isChatVisible && isEditorVisible}
                         >
                            <PanelLeftOpen className="h-4 w-4" />
                            <span className="sr-only">Toggle Editor/Viewer</span>
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">
                        <p>{isEditorVisible ? "Hide" : "Show"} Editor/Viewer & Output</p>
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
                             disabled={!isEditorVisible && isChatVisible}
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
                         disabled={!selectedFile || isSavingFile || isLoadingFile || fileType === 'pdf'} // Disable save for PDF
                       >
                         {isSavingFile ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                           <Save className="mr-2 h-4 w-4 text-primary" />
                         )}
                         {isSavingFile ? "Saving..." : "Save"}
                       </DropdownMenuItem>
                       <DropdownMenuItem
                         onClick={executeCode}
                         disabled={isRunning || isLoadingFile || isSavingFile || fileType !== 'code'} // Disable run for non-code
                       >
                         {isRunning ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                           <Play className="mr-2 h-4 w-4 text-primary" />
                         )}
                         {isRunning ? "Running..." : "Run"}
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={clearOutput} disabled={fileType !== 'code'}> {/* Disable clear for non-code */}
                         <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
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
                               disabled={!selectedFile || isSavingFile || isLoadingFile || fileType === 'pdf'} // Disable save for PDF
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
                             <p>Save File ({selectedFile || 'No file'}) {fileType === 'pdf' ? '(Disabled for PDF)' : ''}</p>
                          </TooltipContent>
                      </Tooltip>

                       <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                               onClick={executeCode}
                               disabled={isRunning || isLoadingFile || isSavingFile || fileType !== 'code'} // Disable run for non-code
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

                       <Tooltip>
                          <TooltipTrigger asChild>
                              <Button onClick={clearOutput} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground h-8 w-8" disabled={fileType !== 'code'}> {/* Disable clear for non-code */}
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

         {/* Main Layout */}
          {isMobile ? renderMobileLayout() : renderDesktopLayout()}

       </div>
    </TooltipProvider>
  );
}
