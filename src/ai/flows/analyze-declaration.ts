
// This file uses server-side code.
'use server';

/**
 * @fileOverview Analyzes a product declaration (ingredient list) for potential gluten ingredients.
 *
 * - analyzeDeclaration - A function that analyzes the declaration text.
 * - AnalyzeDeclarationInput - The input type for the analyzeDeclaration function.
 * - AnalyzeDeclarationOutput - The return type for the analyzeDeclaration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDeclarationInputSchema = z.object({
  declarationText: z
    .string()
    .describe('The product declaration text (ingredient list) to analyze.'),
  labelingInfo: z.enum(['aoecs', 'gf_text', 'none', 'unknown']).optional()
    .describe('Information about gluten-free labeling on the product packaging: "aoecs" (AOECS certified), "gf_text" (generic gluten-free text/icon), "none" (no label), "unknown" (not provided).'),
});
export type AnalyzeDeclarationInput = z.infer<typeof AnalyzeDeclarationInputSchema>;

const AnalyzeDeclarationOutputSchema = z.object({
  hasGluten: z
    .boolean()
    .describe('Whether the ingredient list likely contains gluten or trace ingredients.'),
  glutenIngredients: z
    .array(z.string())
    .describe('A list of potential gluten-containing ingredients found in the declaration.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('A confidence score (0-1) indicating the certainty of the gluten detection.'),
  reason: z.string().describe('The reasoning behind the gluten detection result, including notes on milk allergens if present, and considering any provided labeling information.'),
});
export type AnalyzeDeclarationOutput = z.infer<typeof AnalyzeDeclarationOutputSchema>;

export async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
  return analyzeDeclarationFlow(input);
}

const analyzeDeclarationPrompt = ai.definePrompt({
  name: 'analyzeDeclarationPrompt',
  input: {schema: AnalyzeDeclarationInputSchema},
  output: {schema: AnalyzeDeclarationOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing food ingredient lists to detect gluten based on a specific set of rules.
Your goal is to determine if a product is safe for individuals with Celiac disease based ONLY on the provided ingredient list, any 'labelingInfo' (like "aoecs" or "gf_text" which indicate gluten-free certification/labeling), and the rules below.

**Analysis Rules:**

**🔴 RED LIST (Forbidden Ingredients - if any of these are present, the product is NOT safe):**
*   wheat (including wheat flour, wheat berries, durum, farina, graham, semolina, spelt, einkorn, emmer, kamut)
*   rye
*   barley
*   triticale
*   malt (syrup, extract, flavor)
*   brewer’s yeast

**🟠 ORANGE LIST (Conditionally Permitted Ingredients - check if labeled "gluten-free". If not, consider them risky):**
*   wheat starch
*   caramel color
*   dextrin
*   maltodextrin
*   natural flavors
*   yeast extract
*   vanilla flavor

**🔍 RISKY PHRASES (Indicating potential contamination):**
*   “may contain wheat/gluten”
*   “made on shared equipment with wheat”
*   “produced in a facility that processes wheat”

**✅ SAFE INGREDIENTS (Generally safe if not contaminated):**
*   Naturally gluten-free grains: rice, corn, quinoa, millet, sorghum, buckwheat, amaranth, potato, tapioca, arrowroot, teff, yucca
*   Other naturally gluten-free foods: meat, fish, eggs, dairy, vegetables, fruits, legumes, nuts.

**⚠️ IMPORTANT NOTES:**
1.  **Labeling Information (\`{{{labelingInfo}}}\`):**
    *   If \`labelingInfo\` is 'aoecs' (AOECS certified) or 'gf_text' (generic gluten-free text/icon), this is a strong indicator the product is gluten-free.
    *   For ingredients on the **ORANGE LIST**: If \`labelingInfo\` indicates 'aoecs' or 'gf_text', you can generally consider these ingredients safe (e.g., gluten-free wheat starch, gluten-free maltodextrin). This means the manufacturer has likely ensured these risky ingredients are gluten-free.
    *   If \`labelingInfo\` is 'none' or 'unknown', ORANGE LIST ingredients must be considered risky unless their source is explicitly stated as gluten-free in the ingredient list itself (e.g., "maltodextrin (from corn)").
2.  **Contamination with Safe Grains:** If a product contains naturally gluten-free grains (from the SAFE INGREDIENTS list, e.g., quinoa, corn) BUT is NOT explicitly labeled gluten-free (i.e., \`labelingInfo\` is 'none' or 'unknown') AND also contains any phrases from the RISKY PHRASES list, treat the product as potentially contaminated and therefore set \`hasGluten: true\` with high confidence (0.9).
3.  **Oats:** Oats are naturally gluten-free but often contaminated. If "oats" (or "zob") are listed and the product is NOT certified gluten-free (e.g., \`labelingInfo\` is not 'aoecs' or 'gf_text'), consider them risky and set \`hasGluten: true\`, \`confidence: 0.95\`. Certified gluten-free oats (indicated by 'aoecs' or 'gf_text' labeling) are safe.

**Analysis Process & Confidence:**

1.  **Check for RED LIST Ingredients:** If any are found, set \`hasGluten: true\`, list them in \`glutenIngredients\`, and set \`confidence: 1.0\`. The product is not safe.
2.  **Oats:** If "oats" or "zob" are present and \`labelingInfo\` is NOT 'aoecs' or 'gf_text', set \`hasGluten: true\`, list "Uncertified oats" in \`glutenIngredients\`, and set \`confidence: 0.95\`. The product is not safe. (If 'aoecs' or 'gf_text' is present, oats are considered safe under that label).
3.  **Check for RISKY PHRASES:**
    *   If any RISKY PHRASES are found AND \`labelingInfo\` is NOT 'aoecs' (i.e., it's 'gf_text', 'none', or 'unknown'), set \`hasGluten: true\`, list "Potential cross-contamination" in \`glutenIngredients\`, and set \`confidence: 0.9\`. The product is not safe.
    *   If RISKY PHRASES are found BUT \`labelingInfo\` IS 'aoecs', such warnings are often permissible. If no other gluten sources are found, set \`hasGluten: false\` with \`confidence: 0.8-0.9\`. The product is considered safe under AOECS despite the advisory.
4.  **Evaluate ORANGE LIST Ingredients:** For each ORANGE LIST ingredient:
    *   If \`labelingInfo\` is 'aoecs' or 'gf_text', assume the ingredient is sourced/processed to be gluten-free. Do not mark as gluten-containing solely based on this.
    *   If \`labelingInfo\` is 'none' or 'unknown' (or not provided), AND the ingredient itself is not explicitly declared as gluten-free (e.g., "gluten-free wheat starch"): set \`hasGluten: true\`, list the specific ingredient in \`glutenIngredients\`. Confidence for this should be between 0.6 (for items like 'natural flavors' if it's the only concern) and 0.8 (for items like 'wheat starch' without GF declaration). If multiple such ORANGE ingredients exist without GF labeling, the overall confidence for \`hasGluten: true\` should be higher.
5.  **Default to Safe:** If none of the above conditions set \`hasGluten: true\`, then set \`hasGluten: false\`.
    *   If \`labelingInfo\` is 'aoecs' or 'gf_text': \`confidence: 0.9-1.0\`.
    *   If \`labelingInfo\` is 'none' or 'unknown' but ingredients otherwise appear safe: \`confidence: 0.7-0.8\` (reflecting unaddressed general contamination risk).

**Reasoning:**
In the 'reason' field, explain your decision based on these rules, citing specific ingredients or phrases found. Mention how \`labelingInfo\` (e.g., 'aoecs', 'gf_text', 'none') influenced the decision for any ORANGE LIST ingredients or contamination risk.

**Milk Allergens (Secondary Task):**
After gluten analysis, also check for common milk allergens (e.g., milk, lactose, whey, casein, milk proteins, cream, butter, cheese, mleko, surutka, kazein, pavlaka, maslac, sir). Include any findings in the 'reason' field as a *separate note* from the gluten analysis. For example: "Note on milk: Contains milk powder. May not be suitable for those with lactose intolerance or milk protein allergy." This does NOT affect the \`hasGluten\` status.

Product Declaration to Analyze:
\`{{{declarationText}}}\`
`,
});

const analyzeDeclarationFlow = ai.defineFlow(
  {
    name: 'analyzeDeclarationFlow',
    inputSchema: AnalyzeDeclarationInputSchema,
    outputSchema: AnalyzeDeclarationOutputSchema,
  },
  async (input) => {
    const promptInput = {
      declarationText: input.declarationText,
      labelingInfo: input.labelingInfo || 'unknown', // Default to 'unknown' if not provided
    };
    const {output} = await analyzeDeclarationPrompt(promptInput);
    
    if (output && typeof output.confidence === 'number') {
      output.confidence = Math.max(0, Math.min(1, output.confidence));
    } else if (output) {
      // If confidence is missing or not a number, set a default or handle as an error case
      output.confidence = 0.5; // Example default, adjust as needed
    }
    return output!;
  }
);
    
