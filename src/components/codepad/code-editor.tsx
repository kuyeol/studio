"use client";

import * as React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
// Add more languages as needed: import 'prismjs/components/prism-python';

// Import the CSS directly if not using global styles,
// but we defined styles in globals.css
// import 'prismjs/themes/prism-okaidia.css'; // Example theme

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
}

export default function CodeEditor({ code, setCode }: CodeEditorProps) {
  return (
    <div className="h-full w-full overflow-auto bg-background code-editor-wrapper rounded-t-lg p-1">
        <Editor
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.javascript, "javascript")} // Default to JS
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            outline: 0, // Remove default outline
            minHeight: '100%',
            backgroundColor: 'hsl(var(--background))', // Ensure background color consistency
            color: 'hsl(var(--foreground))', // Ensure text color consistency
          }}
          textareaClassName="focus:outline-none"
          preClassName="focus:outline-none"
        />
    </div>
  );
}
