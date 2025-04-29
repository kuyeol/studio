
// This is a placeholder for a real backend API service.
// In a real application, these functions would make fetch requests
// to your backend endpoints (e.g., /api/files, /api/files/:fileName).

// Simulate a delay to mimic network latency
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Placeholder file storage (simulating a simple backend)
const mockFileSystem: Record<string, string> = {
  "welcome.js": "console.log('Welcome to CodePad!');\n\n// Try editing this file and saving.",
  "example.ts": "interface User {\n  name: string;\n  id: number;\n}\n\nconst user: User = { name: 'Demo User', id: 1 };\nconsole.log(user);",
  "styles.css": "body {\n  font-family: sans-serif;\n  background-color: #f0f0f0;\n}",
  "README.md": "# My CodePad Project\n\nThis is a sample markdown file.",
};

/**
 * Fetches the list of available files.
 * @returns A promise that resolves to an array of file names.
 */
export async function listFiles(): Promise<string[]> {
  await simulateDelay(800); // Simulate network delay
  // Simulate a potential error
  // if (Math.random() > 0.8) {
  //   throw new Error("Network error: Failed to fetch file list.");
  // }
  return Object.keys(mockFileSystem);
}

/**
 * Reads the content of a specific file.
 * @param fileName The name of the file to read.
 * @returns A promise that resolves to the file content as a string.
 */
export async function readFile(fileName: string): Promise<string> {
  await simulateDelay(500); // Simulate network delay
  if (fileName in mockFileSystem) {
    return mockFileSystem[fileName];
  } else {
    throw new Error(`File not found: ${fileName}`);
  }
}

/**
 * Saves content to a specific file.
 * In a real backend, this would likely create the file if it doesn't exist.
 * @param fileName The name of the file to save.
 * @param content The content to save to the file.
 * @returns A promise that resolves when the file is saved.
 */
export async function saveFile(fileName: string, content: string): Promise<void> {
  await simulateDelay(1000); // Simulate network delay for saving
   // Simulate a potential save error
  // if (Math.random() > 0.85) {
  //   throw new Error("Network error: Failed to save file.");
  // }
  if (fileName in mockFileSystem) {
     mockFileSystem[fileName] = content;
     console.log(`Saved content to ${fileName}:\n${content}`);
  } else {
      // In this mock, we'll just add it. A real API might handle this differently.
      mockFileSystem[fileName] = content;
      console.log(`Created and saved content to new file ${fileName}:\n${content}`);
      // Note: In a real app, saving a *new* file might require a different
      // UI flow or confirmation, and listFiles would need to be re-fetched
      // or the local state updated. This mock keeps it simple.
  }

}
