
'use server';
/**
 * @fileOverview Extracts text from an image of a product declaration using OCR.
 *
 * - ocrDeclaration - A function that takes an image data URI and returns extracted text.
 * - OcrDeclarationInput - The input type for the ocrDeclaration function.
 * - OcrDeclarationOutput - The return type for the ocrDeclaration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OcrDeclarationInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a product declaration, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OcrDeclarationInput = z.infer<typeof OcrDeclarationInputSchema>;

const OcrDeclarationOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the product declaration image.'),
});
export type OcrDeclarationOutput = z.infer<typeof OcrDeclarationOutputSchema>;

export async function ocrDeclaration(input: OcrDeclarationInput): Promise<OcrDeclarationOutput> {
  return ocrDeclarationFlow(input);
}

const ocrPrompt = ai.definePrompt({
  name: 'ocrDeclarationPrompt',
  input: {schema: OcrDeclarationInputSchema},
  output: {schema: OcrDeclarationOutputSchema},
  prompt: `You are an Optical Character Recognition (OCR) specialist.
Extract all text from the provided image. The image contains a product ingredient list or nutritional declaration.
Prioritize accuracy and try to maintain the original line breaks if possible, but return a single block of text.

Image: {{media url=imageDataUri}}`,
});

const ocrDeclarationFlow = ai.defineFlow(
  {
    name: 'ocrDeclarationFlow',
    inputSchema: OcrDeclarationInputSchema,
    outputSchema: OcrDeclarationOutputSchema,
  },
  async (input) => {
    const {output} = await ocrPrompt(input);
    return output!;
  }
);
