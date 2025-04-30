
// This is a placeholder for a real backend API service.
// In a real application, these functions would make fetch requests
// to your backend endpoints (e.g., /api/files, /api/files/:fileName).

// Simulate a delay to mimic network latency
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Placeholder PDF URL (Replace with a real, accessible PDF URL for testing)
// You can find sample PDFs online, e.g., https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
// Using a local file path here might work during dev but not in deployment. Use a URL.
const samplePdfUrl = '/sample.pdf'; // Assumes sample.pdf is in the public folder

// Placeholder file storage (simulating a simple backend)
const mockFileSystem: Record<string, string> = {
  "hello.java":"public",
  "welcome.js": "console.log('Welcome to CodePad!');\n\n// Try editing this file and saving.",
  "example.ts": "interface User {\n  name: string;\n  id: number;\n}\n\nconst user: User = { name: 'Demo User', id: 1 };\nconsole.log(user);",
  "styles.css": "body {\n  font-family: sans-serif;\n  background-color: #f0f0f0;\n}",
  "README.md": "# My CodePad Project\n\nThis is a sample markdown file.",
  "sample.pdf": samplePdfUrl, // Store the URL for the PDF
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
 * For PDFs, it returns a URL. For others, it returns text content.
 * @param fileName The name of the file to read.
 * @returns A promise that resolves to the file content (string or URL).
 */
export async function readFile(fileName: string): Promise<string> {
  await simulateDelay(500); // Simulate network delay
  if (fileName in mockFileSystem) {
    return mockFileSystem[fileName]; // Returns text content or PDF URL
  } else {
    throw new Error(`File not found: ${fileName}`);
  }
}

/**
 * Saves content to a specific file.
 * This mock function does not handle saving PDF files differently.
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
  if (fileName.endsWith('.pdf')) {
      console.warn(`Saving PDF files (${fileName}) is not fully supported in this mock implementation.`);
      // In a real backend, you'd handle PDF uploads/updates appropriately.
      // For this mock, we'll just log and not modify the mockFileSystem entry if it's the sample PDF.
      if (fileName !== 'sample.pdf') {
         mockFileSystem[fileName] = content; // Treat as text/URL for non-sample PDFs for mock purposes
      }
      return;
  }

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

/**
 * Uploads a file. In this mock, it reads the content and calls saveFile.
 * For PDFs, it tries to represent it as a data URL (limited practical use in mock).
 * @param file The file object to upload.
 * @returns A promise that resolves when the file is uploaded.
 */
export async function uploadFile(file: File): Promise<void> {
     await simulateDelay(1200); // Simulate upload delay

     return new Promise((resolve, reject) => {
       const reader = new FileReader();

       reader.onload = async (e) => {
         try {
           const content = e.target?.result as string; // Content as text or data URL
           await saveFile(file.name, content); // Use saveFile to add/update in mock
           resolve();
         } catch (saveError) {
           reject(saveError);
         }
       };

       reader.onerror = (e) => {
         reject(new Error(`Error reading file: ${reader.error}`));
       };

        // Read as text for non-PDFs, as Data URL for PDFs (basic mock handling)
        if (file.type === 'application/pdf') {
             reader.readAsDataURL(file); // Read PDF as Data URL for mock
        } else {
            reader.readAsText(file); // Read other files as text
        }
     });
}
