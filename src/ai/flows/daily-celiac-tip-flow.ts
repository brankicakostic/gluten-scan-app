// This file uses server-side code.
'use server';

/**
 * @fileOverview Generates a daily tip or "did you know" fact about Celiac disease,
 * providing both a summary and detailed information.
 *
 * - getDailyCeliacTip - A function that returns a daily tip with summary and details.
 * - DailyCeliacTipOutput - The return type for the getDailyCeliacTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyCeliacTipOutputSchema = z.object({
  summary: z.string().describe('A short, engaging summary of the tip or fact about Celiac disease (1-2 sentences). This is not medical advice.'),
  details: z.string().describe('A more detailed explanation or elaboration of the tip (2-4 sentences). This section must include a reminder that this information is not medical advice and users should consult a healthcare professional for medical concerns.'),
});
export type DailyCeliacTipOutput = z.infer<typeof DailyCeliacTipOutputSchema>;

export async function getDailyCeliacTip(): Promise<DailyCeliacTipOutput> {
  return dailyCeliacTipFlow();
}

const dailyCeliacTipPrompt = ai.definePrompt({
  name: 'dailyCeliacTipPrompt',
  output: {schema: DailyCeliacTipOutputSchema},
  prompt: `You are a helpful AI assistant providing informative content for individuals interested in Celiac disease.
Generate a "Daily Tip" or "Did You Know?" fact about Celiac disease.
This should consist of two parts:
1. A 'summary': A concise, engaging highlight of the tip (1-2 sentences).
2. A 'details': A more in-depth explanation or elaboration of the tip (2-4 sentences).

It is crucial to include a reminder in the 'details' section that this information is not medical advice and individuals should consult with healthcare professionals for any health concerns.

Example:
Summary: "Did you know? Alcohol, like 70% ethanol, doesn't always destroy gluten on surfaces. Extra care is needed for cleaning and with some beverages."
Details: "While 70% alcohol is a good disinfectant, it may not fully denature or remove gluten proteins from surfaces, making thorough cleaning with soap and water essential for celiacs. Also, be cautious with some alcoholic beverages, especially liqueurs or flavored spirits, as they might contain gluten-based additives or be processed with gluten-containing ingredients. Always check labels or contact the manufacturer. This information is not medical advice; please consult with a healthcare professional for dietary guidance."

Provide the output in the specified 'summary' and 'details' fields.`,
});

const dailyCeliacTipFlow = ai.defineFlow(
  {
    name: 'dailyCeliacTipFlow',
    outputSchema: DailyCeliacTipOutputSchema,
  },
  async () => {
    const {output} = await dailyCeliacTipPrompt({});
    return output!;
  }
);
