
"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Folder, File as FileIcon, AlertCircle, RefreshCw, X } from "lucide-react"; // Add icons, Add X
import { listFiles } from "@/services/file-api"; // Import API function
import { cn } from "@/lib/utils";
// Removed: import { useIsMobile } from "@/hooks/use-mobile";
// Removed: import { SheetClose } from "@/components/ui/sheet";


interface FileBrowserProps {
  onSelectFile: (fileName: string) => void;
  selectedFile: string | null;
}

export default function FileBrowser({ onSelectFile, selectedFile }: FileBrowserProps) {
  const [files, setFiles] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // Removed: const isMobile = useIsMobile(); // Check if mobile

  const fetchFileList = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      console.error("Error fetching file list:", err);
      setError("Failed to load file list. Please try again.");
      setFiles([]); // Clear files on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFileList();
  }, [fetchFileList]);

  const handleRetry = () => {
    fetchFileList();
  };

  // Removed the conditional SheetClose wrapper logic
  // const FileButtonWrapper = isMobile ? SheetClose : React.Fragment;


  return (
     // Use bg-secondary for the file browser panel background
    <div className="flex flex-col h-full bg-secondary text-secondary-foreground border-t border-border md:border-r md:border-t-0">
       {/* Header remains card background for visual separation */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card text-card-foreground">
        <div className="flex items-center gap-2">
           <Folder className="h-5 w-5 text-primary" />
           <h2 className="text-lg font-semibold">Files</h2>
        </div>
         <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={handleRetry} disabled={isLoading} className="h-7 w-7 text-muted-foreground hover:text-foreground">
               <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
               <span className="sr-only">Refresh Files</span>
             </Button>
              {/* Mobile close button handled by SheetContent */}
         </div>
      </div>
      {/* ScrollArea uses output-panel style, padding adjusted */}
      <ScrollArea className="flex-grow p-2 output-panel">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {/* Show skeletons while loading */}
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md bg-muted" /> // Skeleton uses muted bg
            ))}
          </div>
        ) : error ? (
           <div className="p-4 text-center text-destructive">
             <AlertCircle className="h-6 w-6 mx-auto mb-2"/>
             <p className="text-sm">{error}</p>
             <Button variant="outline" size="sm" onClick={handleRetry} className="mt-4">
                Retry
             </Button>
           </div>
        ) : files.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No files found.</p>
            </div>
        ): (
          <div className="space-y-1">
            {files.map((file) => (
                // Render Button directly, Sheet closing is handled in CodePad's onSelectFile
                <Button
                  key={file}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left h-8 px-2 text-secondary-foreground", // Ensure default text color
                    selectedFile === file
                      ? "bg-accent text-accent-foreground" // Selected uses accent
                      : "hover:bg-muted hover:text-muted-foreground" // Hover uses muted
                  )}
                  onClick={() => onSelectFile(file)}
                  title={file}
                >
                  <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-grow">{file}</span>
                </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
