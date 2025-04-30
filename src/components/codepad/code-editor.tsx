
"use client";

import * as React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup"; // For HTML/XML/Markdown (basic)
// Add more languages as needed: import 'prismjs/components/prism-python';

// Import the CSS directly if not using global styles,
// but we defined styles in globals.css
// import 'prismjs/themes/prism-okaidia.css'; // Example theme

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  disabled?: boolean; // Add disabled prop
}

// Basic language detection based on file extension (can be improved)
const getLanguage = (fileName: string | null): string => {
  if (!fileName) return "javascript"; // Default
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
    case 'xml':
    case 'md': // Basic markdown highlighting
      return 'markup';
    // Add more cases as needed (e.g., 'py' for python)
    default:
      return 'clike'; // Generic fallback
  }
};


export default function CodeEditor({ code, setCode, disabled = false }: CodeEditorProps) {
    // We don't have the filename directly here, so we'll default to JS
    // A better approach might involve passing the selected file name down
    // or having a language selector. For now, default to JS.
    const language = 'javascript'; // Defaulting, see comment above
    const prismLanguage = languages[language] || languages.clike;

  return (
    // Use bg-card for the editor background to match the light theme panels
    <div className={`h-full w-full overflow-auto bg-card text-card-foreground code-editor-wrapper rounded-t-lg p-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <Editor
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, prismLanguage, language)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            outline: 0, // Remove default outline
            minHeight: '100%',
            backgroundColor: 'hsl(var(--card))', // Ensure background color consistency (card)
            color: 'hsl(var(--foreground))', // Ensure text color consistency (foreground)
             // Prevent interaction when disabled
            pointerEvents: disabled ? 'none' : 'auto',
          }}
          textareaClassName="focus:outline-none"
          preClassName="focus:outline-none"
          disabled={disabled} // Pass disabled prop to the underlying textarea
        />
    </div>
  );
}
