"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OutputPanelProps {
  output: string[];
}

export default function OutputPanel({ output }: OutputPanelProps) {
  return (
    <ScrollArea className="h-full w-full bg-card text-card-foreground p-4 rounded-b-lg output-panel">
      <pre className="text-sm whitespace-pre-wrap break-words">
        {output.length > 0 ? output.join("\n") : "Output will appear here..."}
      </pre>
    </ScrollArea>
  );
}
