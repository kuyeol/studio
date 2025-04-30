
"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


interface PdfViewerProps {
  fileUrl: string | null;
}

// Ensure worker is configured (consider moving to a shared config or layout if used elsewhere)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState<number>(1.0);
  const { toast } = useToast();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error): void => {
    console.error("Error loading PDF:", error);
    setError(`Failed to load PDF: ${error.message}`);
    setIsLoading(false);
    setNumPages(null);
     toast({
      variant: "destructive",
      title: "PDF Load Error",
      description: `Could not load the PDF document. (${error.message})`,
    });
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0)); // Max zoom 300%
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5)); // Min zoom 50%

  React.useEffect(() => {
      // Reset state when fileUrl changes
      setIsLoading(true);
      setError(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
  }, [fileUrl]);

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-card text-muted-foreground p-4">
        Select a PDF file to view.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-card text-card-foreground rounded-t-lg overflow-hidden">
      {/* Toolbar */}
       <div className="flex items-center justify-between p-2 border-b border-border bg-secondary flex-shrink-0">
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={zoomOut} disabled={isLoading || scale <= 0.5} className="h-7 w-7">
                 <ZoomOut className="h-4 w-4" />
                 <span className="sr-only">Zoom Out</span>
             </Button>
             <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={zoomIn} disabled={isLoading || scale >= 3.0} className="h-7 w-7">
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Zoom In</span>
              </Button>
           </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={isLoading || pageNumber <= 1} className="h-7 w-7">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                </Button>
                <span className="text-sm font-medium">
                    Page {isLoading ? '...' : pageNumber} of {numPages ?? '...'}
                </span>
                 <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={isLoading || pageNumber >= (numPages || 1)} className="h-7 w-7">
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                </Button>
            </div>
        </div>

      {/* PDF Content Area */}
      <ScrollArea className="flex-grow bg-muted/30 output-panel"> {/* Use output-panel style scrollbar */}
         <div className="p-4 flex justify-center items-start min-h-full">
             {isLoading && (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>Loading PDF...</p>
                </div>
             )}
             {error && !isLoading && (
                 <div className="flex flex-col items-center justify-center h-full text-destructive pt-10">
                    <AlertCircle className="h-8 w-8 mb-4" />
                    <p className="text-center max-w-md">{error}</p>
                </div>
             )}
             {!isLoading && !error && fileUrl && (
                 <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null} // Handled by our own loading state
                    error={null} // Handled by our own error state
                    className="flex justify-center pdf-document" // Added class for potential styling
                    options={{
                        // You can pass standard PDF.js options here if needed
                        // cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                        // cMapPacked: true,
                    }}
                 >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        loading={null} // Page level loading indicator if needed
                        error={null} // Page level error display if needed
                        renderAnnotationLayer={true} // Keep annotation layer
                        renderTextLayer={true}      // Keep text layer for selectability
                        className="pdf-page shadow-md" // Added class for potential styling
                    />
                </Document>
             )}
        </div>
      </ScrollArea>
    </div>
  );
}
