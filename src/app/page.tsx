'use client'; // Required for client-side interaction (hooks, event handlers)

import * as React from 'react';
import CodePad from "@/components/codepad"; // Import the main CodePad component

export default function HomePage() {
  return (
    // Add a container for layout if needed, e.g., flex-col
    <div className="flex flex-col h-screen">
      {/* Rest of the CodePad component takes remaining space */}
      <div className="flex-grow overflow-hidden">
         <CodePad />
      </div>
    </div>
  );
}

