
'use server';
/**
 * @fileOverview Defines the chat flow for the CodePad AI assistant.
 *
 * - chat - A function to handle chat interactions.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 * - Message - Represents a single message in the conversation history.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define the structure for a single message in the conversation
const MessageSchema = z.object({
  role: z.enum(['user', 'model']), // Who sent the message
  content: z.string(), // The text content of the message
});
export type Message = z.infer<typeof MessageSchema>;

// Define the input schema for the chat flow
const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history so far.'),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

// Define the output schema for the chat flow
const ChatOutputSchema = z.object({
  response: z.string().describe('The AI model\'s response to the user message.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Define the chat prompt
const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {
    schema: ChatInputSchema,
  },
  output: {
    schema: ChatOutputSchema,
  },
  prompt: `You are an AI assistant integrated into a web-based code editor called CodePad. Your role is to help users with their coding questions, explain concepts, provide code examples, and assist with debugging. Be concise and helpful.

Conversation History:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
user: {{{message}}}
model: `, // The prompt structure includes history and the latest user message
});

// Define the chat flow
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Call the prompt with the input (history + new message)
    const result = await chatPrompt(input);
    const output = result.output();

    if (!output) {
      throw new Error('The AI model did not return a valid response.');
    }

    // Return the structured output
    return {
      response: output.response,
    };
  }
);

/**
 * Sends a user message and conversation history to the AI chat flow
 * and returns the AI's response.
 * @param input - The chat input containing history and the new message.
 * @returns A promise that resolves to the AI's response.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}
