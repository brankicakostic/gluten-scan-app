
'use server';
/**
 * @fileOverview Extracts structured product information (name, brand) from an image.
 *
 * - extractProductInfo - A function that takes an image and returns the product name and brand.
 * - ExtractProductInfoInput - The input type for the function.
 * - ExtractProductInfoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ocrDeclaration } from './ocr-declaration-flow';

const ExtractProductInfoInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a product, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});
export type ExtractProductInfoInput = z.infer<typeof ExtractProductInfoInputSchema>;

const ExtractProductInfoOutputSchema = z.object({
  productName: z.string().describe("The extracted product name. Should be concise and accurate."),
  brand: z.string().describe("The extracted brand name. If no brand is found, this can be an empty string."),
  fullText: z.string().describe("The full, raw text extracted from the image by OCR."),
});
export type ExtractProductInfoOutput = z.infer<typeof ExtractProductInfoOutputSchema>;

export async function extractProductInfo(input: ExtractProductInfoInput): Promise<ExtractProductInfoOutput> {
  return extractProductInfoFlow(input);
}

// This prompt is designed to get structured data from OCR text.
const structuredExtractionPrompt = ai.definePrompt({
    name: 'structuredExtractionPrompt',
    input: { schema: z.object({ ocrText: z.string() }) },
    output: { schema: z.object({ productName: z.string(), brand: z.string() }) },
    prompt: `From the following text extracted from a product's front packaging, identify the main product name and the brand name.
    - The product name should be the most prominent name of the item.
    - The brand is the company that makes the product.
    - If you cannot confidently identify a brand, leave the brand field empty.

    Extracted Text:
    ---
    {{{ocrText}}}
    ---
    `,
});

const extractProductInfoFlow = ai.defineFlow(
  {
    name: 'extractProductInfoFlow',
    inputSchema: ExtractProductInfoInputSchema,
    outputSchema: ExtractProductInfoOutputSchema,
  },
  async (input) => {
    // Step 1: Perform OCR on the image to get raw text.
    const ocrResult = await ocrDeclaration({ imageDataUri: input.imageDataUri });
    const fullText = ocrResult.extractedText;

    if (!fullText.trim()) {
        return { productName: '', brand: '', fullText: '' };
    }

    // Step 2: Use the extracted text to get structured information.
    const { output } = await structuredExtractionPrompt({ ocrText: fullText });
    
    return {
        productName: output?.productName || '',
        brand: output?.brand || '',
        fullText: fullText,
    };
  }
);
