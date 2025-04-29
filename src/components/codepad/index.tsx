"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeEditor from "./code-editor";
import OutputPanel from "./output-panel";
import { Button } from "@/components/ui/button";
import { Play, Trash2 } from "lucide-react";

export default function CodePad() {
  const [code, setCode] = React.useState<string>("// Start coding here!\nconsole.log('Hello, CodePad!');");
  const [output, setOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);

  // Dummy execution function - replace with actual backend call
  const executeCode = async () => {
    setIsRunning(true);
    setOutput(["Executing code..."]);

    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // In a real scenario, this would be an API call to a backend service
      // that safely executes the Node.js code in a sandboxed environment.
      // For this frontend demo, we'll just log the code.
      console.log("Executing code:\n", code);
      setOutput([`Simulated execution complete. Output:` , `Hello, CodePad!`]); // Example output
    } catch (error: any) {
      setOutput([`Error: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
       <header className="flex items-center justify-end p-2 border-b border-border">
         <Button onClick={executeCode} disabled={isRunning} variant="ghost" size="sm" className="text-accent hover:bg-accent/10 hover:text-accent mr-2">
           <Play className="mr-2 h-4 w-4" />
           {isRunning ? "Running..." : "Run"}
         </Button>
         <Button onClick={clearOutput} variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/10 hover:text-muted-foreground">
           <Trash2 className="mr-2 h-4 w-4" />
           Clear Output
         </Button>
       </header>
      <ResizablePanelGroup direction="vertical" className="flex-grow rounded-lg">
        <ResizablePanel defaultSize={60} minSize={20}>
          <CodeEditor code={code} setCode={setCode} />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border hover:bg-accent data-[resize-handle-active]:bg-accent transition-colors duration-200" />
        <ResizablePanel defaultSize={40} minSize={10}>
          <OutputPanel output={output} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
