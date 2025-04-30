
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
  "hello.java":"public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java World!\");\n    }\n}",
  "welcome.js": "console.log('Welcome to CodePad!');\n\n// Try editing this file and saving.",
  "example.ts": "interface User {\n  name: string;\n  id: number;\n}\n\nconst user: User = { name: 'Demo User', id: 1 };\nconsole.log(user);",
  "styles.css": "body {\n  font-family: sans-serif;\n  background-color: #f0f0f0;\n}",
  "README.md": "# CodePad Demo\n\nThis is a **Markdown** file.\n\n## Features\n\n*   Code Editing\n*   File Browser\n*   AI Chat\n*   PDF Viewing\n*   Markdown Preview\n\n```javascript\nconsole.log('Hello from Markdown!');\n```\n\n> You can select this file to see the preview.",
  "sample.pdf": samplePdfUrl, // Store the URL for the PDF
  "document.md": "## Another Markdown File\n\nThis demonstrates loading different `.md` files.\n\n* Item 1\n* Item 2\n\n[Link to Google](https://google.com)",
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
    return mockFileSystem[fileName]; // Returns text content, Markdown content, or PDF URL
  } else {
    throw new Error(`File not found: ${fileName}`);
  }
}

/**
 * Saves content to a specific file.
 * This mock function does not handle saving PDF or Markdown files differently.
 * Saving Markdown content would ideally update the preview if applicable.
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

  // Block saving PDF/Markdown in this mock, only allow code saving
   if (fileName.endsWith('.pdf')) {
      console.warn(`Saving PDF files (${fileName}) is not supported in this mock implementation.`);
      return Promise.reject(new Error("Saving PDF is not supported."));
   }
   if (fileName.endsWith('.md')) {
        console.warn(`Saving Markdown files (${fileName}) is not supported in this mock implementation.`);
        // Mock saving MD files by updating the content, but ideally, editing would happen elsewhere
        // mockFileSystem[fileName] = content;
        // console.log(`Mock saved content to ${fileName}:\n${content}`);
        // return;
       return Promise.reject(new Error("Saving Markdown is not supported."));
   }

  // Only allow saving for known, non-PDF/MD files or new non-PDF/MD files
  if (fileName in mockFileSystem || !fileName.endsWith('.pdf') && !fileName.endsWith('.md')) {
     mockFileSystem[fileName] = content;
     console.log(`Saved content to ${fileName}:\n${content}`);
  } else {
      // Handle case where file is not known and is PDF/MD (should be blocked above)
      console.error(`Attempted to save unknown or unsupported file type: ${fileName}`);
      throw new Error(`Cannot save unsupported file type: ${fileName}`);
  }

}

/**
 * Uploads a file. In this mock, it reads the content and calls saveFile.
 * For PDFs, it tries to represent it as a data URL (limited practical use in mock).
 * Markdown files are read as text.
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
           // Don't allow uploading PDFs/MDs via this method in the mock if saving is disabled
            if (file.name.endsWith('.pdf')) {
                console.warn("PDF upload mocked, but saving is disabled.");
                mockFileSystem[file.name] = content; // Store Data URL for mock purposes
                // reject(new Error("Uploading PDF is not fully supported for saving."));
                 resolve(); // Allow mock upload for viewing
                return;
            }
             if (file.name.endsWith('.md')) {
                console.warn("Markdown upload mocked, but saving is disabled.");
                 mockFileSystem[file.name] = content; // Store text content for mock purposes
                // reject(new Error("Uploading Markdown is not fully supported for saving."));
                 resolve(); // Allow mock upload for viewing
                return;
            }

           await saveFile(file.name, content); // Use saveFile to add/update in mock for code files
           resolve();
         } catch (saveError) {
           reject(saveError);
         }
       };

       reader.onerror = (e) => {
         reject(new Error(`Error reading file: ${reader.error}`));
       };

        // Read as text for non-PDFs (including Markdown), as Data URL for PDFs
        if (file.type === 'application/pdf') {
             reader.readAsDataURL(file); // Read PDF as Data URL for mock
        } else {
            reader.readAsText(file); // Read other files (including .md) as text
        }
     });
}
