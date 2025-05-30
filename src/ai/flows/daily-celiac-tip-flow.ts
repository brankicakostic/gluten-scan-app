// This file uses server-side code.
'use server';

/**
 * @fileOverview Generates a daily tip or "did you know" fact about Celiac disease.
 *
 * - getDailyCeliacTip - A function that returns a daily tip.
 * - DailyCeliacTipOutput - The return type for the getDailyCeliacTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyCeliacTipOutputSchema = z.object({
  tip: z.string().describe('A short, informative tip or "did you know" fact about Celiac disease. This is not medical advice and users should consult a healthcare professional for medical concerns.'),
});
export type DailyCeliacTipOutput = z.infer<typeof DailyCeliacTipOutputSchema>;

export async function getDailyCeliacTip(): Promise<DailyCeliacTipOutput> {
  return dailyCeliacTipFlow();
}

const dailyCeliacTipPrompt = ai.definePrompt({
  name: 'dailyCeliacTipPrompt',
  output: {schema: DailyCeliacTipOutputSchema},
  prompt: `You are a helpful AI assistant providing informative content for individuals interested in Celiac disease.
Generate a concise "Daily Tip" or "Did You Know?" fact about Celiac disease.
The tip should be easy to understand, engaging, and strictly informational.
It is crucial to include a reminder that this information is not medical advice and individuals should consult with healthcare professionals for any health concerns.
For example: "Did you know? Oats are naturally gluten-free, but often contaminated with wheat during processing. Always look for certified gluten-free oats! Remember, this is not medical advice; consult your doctor for dietary changes."
Or: "Daily Tip: When dining out, always inform the restaurant staff about your gluten-free needs to prevent cross-contamination. Stay safe! This information is for educational purposes only, not medical advice."

Provide only the tip in the 'tip' field of the output.`,
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
