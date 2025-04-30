
"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OutputPanelProps {
  output: string[];
}

export default function OutputPanel({ output }: OutputPanelProps) {
  return (
    // Use bg-secondary for slightly more contrast in the light theme
    <ScrollArea className="h-full w-full bg-secondary text-secondary-foreground p-4 rounded-b-lg output-panel">
      <pre className="text-sm whitespace-pre-wrap break-words">
        {output.length > 0 ? output.join("\n") : "Output will appear here..."}
      </pre>
    </ScrollArea>
  );
}
