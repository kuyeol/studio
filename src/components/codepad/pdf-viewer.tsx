"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PdfViewerProps {
  fileUrl: string | null;
}

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState<number>(1.0);
  const { toast } = useToast();
  const [PDFViewer, setPDFViewer] = useState<any>(null);

  useEffect(() => {
    const loadReactPdf = async () => {
      setIsLoading(true);
      try {
        const { pdfjs, Document, Page } = await import('react-pdf').then((module) => ({
          pdfjs: module.pdfjs,
          Document: module.Document,
          Page: module.Page,
        }));

        // Configure pdfjs worker
        if (typeof window !== 'undefined') {
          pdfjs.GlobalWorkerOptions.workerSrc = `/build/pdf.worker.min.mjs`;
        }
        setPDFViewer({ pdfjs, Document, Page });
      } catch (err: any) {
        console.error("Failed to load react-pdf", err);
        setError(`Failed to load PDF viewer: ${err.message}`);
        toast({
          variant: "destructive",
          title: "PDF Load Error",
          description: `Could not load the PDF viewer. (${err.message})`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReactPdf();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
    setPageNumber(1);
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

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  React.useEffect(() => {
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

  if (isLoading || !PDFViewer) {
    return (
      <div className="flex h-full items-center justify-center bg-card text-muted-foreground p-4">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading PDF Viewer...
      </div>
    );
  }

  const { Document, Page } = PDFViewer;

  return (
    <div className="flex flex-col h-full w-full bg-card text-card-foreground rounded-t-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-secondary flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5} className="h-7 w-7">
            <ZoomOut className="h-4 w-4" />
            <span className="sr-only">Zoom Out</span>
          </Button>
          <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3.0} className="h-7 w-7">
            <ZoomIn className="h-4 w-4" />
            <span className="sr-only">Zoom In</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages ?? '...'}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      </div>

      {/* PDF Content Area */}
      <ScrollArea className="flex-grow bg-muted/30 output-panel">
        <div className="p-4 flex justify-center items-start min-h-full">
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
              loading={<div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading PDF...</p>
              </div>}
              className="flex justify-center pdf-document"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                className="pdf-page shadow-md"
              />
            </Document>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
