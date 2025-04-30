
"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Folder, File as FileIcon, AlertCircle, RefreshCw, X, Upload, Loader2 } from "lucide-react"; // Add Upload, Loader2
import { listFiles, saveFile } from "@/services/file-api"; // Import API functions
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // Import useToast


interface FileBrowserProps {
  onSelectFile: (fileName: string) => void;
  selectedFile: string | null;
}

export default function FileBrowser({ onSelectFile, selectedFile }: FileBrowserProps) {
  const [files, setFiles] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false); // Add uploading state
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null); // Ref for hidden file input
  const { toast } = useToast(); // Initialize toast

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

  // Trigger the hidden file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle the file selection from the input
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const content = await readFileContent(file);
      await saveFile(file.name, content); // Use the existing saveFile API
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}.`,
      });
      await fetchFileList(); // Refresh the file list
    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: `Could not upload ${file.name}. ${err.message || ""}`,
      });
    } finally {
      setIsUploading(false);
      // Reset the input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Helper function to read file content as text
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error(`Error reading file: ${reader.error}`));
      };
      reader.readAsText(file); // Read file as text
    });
  };


  return (
     // Use bg-secondary for the file browser panel background
    <div className="flex flex-col h-full bg-secondary text-secondary-foreground border-t border-border md:border-r md:border-t-0">
       {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".js,.ts,.css,.html,.xml,.md,.txt,.json" // Optional: Specify acceptable file types
      />
       {/* Header remains card background for visual separation */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card text-card-foreground">
        <div className="flex items-center gap-2">
           <Folder className="h-5 w-5 text-primary" />
           <h2 className="text-lg font-semibold">Files</h2>
        </div>
         <div className="flex items-center gap-1">
             {/* Upload Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUploadClick}
                disabled={isLoading || isUploading}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
                <span className="sr-only">{isUploading ? "Uploading..." : "Upload File"}</span>
              </Button>
              {/* Refresh Button */}
             <Button
                variant="ghost"
                size="icon"
                onClick={handleRetry}
                disabled={isLoading || isUploading} // Disable while uploading too
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
             >
               <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
               <span className="sr-only">Refresh Files</span>
             </Button>
         </div>
      </div>
      {/* ScrollArea uses output-panel style, padding adjusted */}
      <ScrollArea className="flex-grow p-2 output-panel">
        {(isLoading || isUploading) ? ( // Show skeletons if loading or uploading
          <div className="space-y-2 p-2">
            {isUploading && (
                <div className="flex items-center justify-center text-sm text-muted-foreground p-2 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin"/> Uploading...
                </div>
            )}
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
                 <Button variant="outline" size="sm" onClick={handleUploadClick} className="mt-4">
                    <Upload className="mr-2 h-4 w-4"/> Upload File
                 </Button>
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

