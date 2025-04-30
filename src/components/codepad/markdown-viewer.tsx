
"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    // Use ScrollArea for potentially long markdown content
    // Use card background and output-panel scrollbar style for consistency
    <ScrollArea className="h-full w-full bg-card text-card-foreground output-panel rounded-t-lg">
      {/* Add padding within the scroll area */}
      <div className="p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]} // Enable GFM features
          className={cn(
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none", // Basic prose styling, adjust as needed
            "prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2", // Heading styles
            "prose-p:leading-relaxed prose-p:mb-4", // Paragraph styles
            "prose-a:text-primary hover:prose-a:underline", // Link styles
            "prose-code:bg-muted prose-code:text-muted-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm", // Inline code
             "prose-pre:bg-card prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-md prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto", // Code blocks (use card background)
            "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground", // Blockquote
             "prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1", // Unordered list
             "prose-ol:list-decimal prose-ol:pl-6 prose-li:mb-1", // Ordered list
             "prose-table:border-collapse prose-table:w-full prose-th:border prose-th:p-2 prose-th:font-semibold prose-td:border prose-td:p-2" // Table styles
          )}
        >
          {content || "No Markdown content loaded."}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
}
