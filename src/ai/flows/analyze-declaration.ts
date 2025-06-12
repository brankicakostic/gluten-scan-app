
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
  reason: z.string().describe('The reasoning behind the gluten detection result, including notes on milk allergens if present, and considering any provided labeling information. If oats are present, specific notes on oats should be included here.'),
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
*   pšenica (uključujući pšenično brašno, pšenične bobice, durum, krupicu, graham, semolinu, speltu, einkorn, emmer, kamut)
*   raž
*   ječam
*   tritikale
*   slad (sirup, ekstrakt, aroma) (osim ako je jasno navedeno da je bezglutenski i deo AOECS sertifikata)
*   pivski kvasac
*   vanilin (ako nije specificirano kao čist vanilin ekstrakt ili sintetički, može biti na bazi slada) - tretirati kao ORANGE LIST ako nije jasno
*   zob (osim ako je sertifikovana kao bezglutenska - vidi pravilo za ZOB)

**🟠 ORANGE LIST (Conditionally Permitted Ingredients - check if labeled "gluten-free" or covered by AOECS. If not, consider them risky):**
*   wheat starch (pšenični skrob)
*   caramel color (karamel boja)
*   dextrin (dekstrin)
*   maltodextrin (maltodekstrin)
*   natural flavors (prirodne arome)
*   yeast extract (ekstrakt kvasca)
*   vanilla flavor (aroma vanile)
*   glucose syrup (glukozni sirup) - ako izvor nije naveden ili je pšenica/ječam, a nije izuzetak po EU regulativi i nema GF oznake. Ako je izuzetak (npr. "glukozni sirup (pšenica)" koji je GF), onda je OK.
*   modified starch (modifikovani skrob) - ako izvor nije naveden kao bezglutenski.
*   hydrolyzed vegetable protein (hidrolizovani biljni protein) - ako izvor nije naveden kao bezglutenski.
*   soy sauce (soja sos) - osim ako je 'tamari' ili jasno deklarisan kao bezglutenski.
*   Thickeners, stabilizers, emulsifiers (Zgušnjivači, stabilizatori, emulgatori) - ako nisu specificirani (npr. E412 guar guma je OK, ali samo "zgušnjivač" je sumnjivo bez GF oznake). Smatraj ih rizičnim ako nema GF oznake na proizvodu.

**🔍 RISKY PHRASES (Indicating potential contamination):**
*   “may contain wheat/gluten” / “može sadržati tragove pšenice/glutena”
*   “made on shared equipment with wheat” / “proizvedeno na opremi koja se koristi i za proizvode sa pšenicom”
*   “produced in a facility that processes wheat” / “proizvedeno u pogonu gde se prerađuje pšenica”

**✅ SAFE INGREDIENTS (Generally safe if not contaminated):**
*   Naturally gluten-free grains: rice, corn, quinoa, millet, sorghum, buckwheat, amaranth, potato, tapioca, arrowroot, teff, yucca (pirinač, kukuruz, kinoa, proso, sirak, heljda, amarant, krompir, tapioka, aru prah, tef, juka)
*   Other naturally gluten-free foods: meat, fish, eggs, dairy (except malted milk drinks), vegetables, fruits, legumes, nuts (meso, riba, jaja, mlečni proizvodi (osim sladnog mleka), povrće, voće, mahunarke, orašasti plodovi).
*   Pure vanilla extract, synthetic vanillin.

**Analysis Process & Confidence:**

1.  **Check for RED LIST Ingredients:** If any are found (and not covered by a specific gluten-free processing declaration under AOECS for example), set \`hasGluten: true\`, list them in \`glutenIngredients\`, and set \`confidence: 1.0\`. The product is not safe.

2.  **Oats (Zob):** Oats are naturally gluten-free but are at high risk of cross-contamination with gluten-containing grains during harvesting, transport, and processing.
    *   **Uncertified/Unlabeled Oats:** If "oats" or "zob" are present AND labelingInfo is 'none' or 'unknown' (i.e., not 'aoecs' or 'gf_text', or the ingredient list does not explicitly state "certified gluten-free oats" or "bezglutenska zob"): set \`hasGluten: true\`, list "Uncertified/unlabeled oats" or "Nesertifikovana/neoznačena zob" in \`glutenIngredients\`, and set \`confidence: 0.95\`. The product is considered risky. In the 'reason' field, state that uncertified/unlabeled oats are risky due to potential cross-contamination.
    *   **Certified/Labeled Gluten-Free Oats:** If "oats" or "zob" are present AND labelingInfo IS 'aoecs' or 'gf_text' (or the ingredient list explicitly states "certified gluten-free oats" or "bezglutenska zob"): these oats are considered gluten-free. Do not set \`hasGluten: true\` based *solely* on oats in this case (unless other RED LIST ingredients are present). However, ALWAYS include the following note in the 'reason' field: 'Note on Oats: This product contains certified/labeled gluten-free oats. While generally safe for most individuals with celiac disease, a small percentage of celiacs may also be sensitive to avenin, a protein naturally found in oats. Consult with a healthcare professional if you have concerns about consuming oats.' (Serbian: 'Napomena o zobi: Ovaj proizvod sadrži sertifikovanu/označenu bezglutensku zob. Iako je generalno bezbedna za većinu osoba sa celijakijom, mali procenat može reagovati na avenin, protein koji se prirodno nalazi u zobi. Konsultujte se sa zdravstvenim radnikom ako imate nedoumice u vezi sa konzumiranjem zobi.')

3.  **Check for RISKY PHRASES:**
    *   If any RISKY PHRASES are found AND labelingInfo is NOT 'aoecs' (i.e., it's 'gf_text', 'none', or 'unknown'), set \`hasGluten: true\`, list "Potential cross-contamination" or "Moguća unakrsna kontaminacija" in \`glutenIngredients\`, and set \`confidence: 0.9\`. The product is not safe.
    *   If RISKY PHRASES are found BUT labelingInfo IS 'aoecs', such warnings are often permissible under AOECS standards. If no other gluten sources are found, set \`hasGluten: false\` with \`confidence: 0.8-0.9\`. The product is considered safe under AOECS despite the advisory.

4.  **Evaluate ORANGE LIST Ingredients:** For each ORANGE LIST ingredient:
    *   If labelingInfo is 'aoecs' or 'gf_text', assume the ingredient is sourced/processed to be gluten-free. Do not mark as gluten-containing solely based on this.
    *   If labelingInfo is 'none' or 'unknown' (or not provided), AND the ingredient itself is not explicitly declared as gluten-free (e.g., "gluten-free wheat starch" / "bezglutenski pšenični skrob"): set \`hasGluten: true\`, list the specific ingredient in \`glutenIngredients\`. Confidence for this should be between 0.6 (for items like 'natural flavors' if it's the only concern) and 0.8 (for items like 'wheat starch' without GF declaration). If multiple such ORANGE ingredients exist without GF labeling, the overall confidence for \`hasGluten: true\` should be higher.
    *   "Vanilin": If listed as just "vanilin" and labelingInfo is 'none' or 'unknown', treat as ORANGE LIST due to potential malt-based carriers. If "pure vanilla extract" or synthetic, it's SAFE. If labelingInfo is 'aoecs' or 'gf_text', assume safe.
    *   Generic terms like "zgušnjivač", "stabilizator", "emulgator": If labelingInfo is 'none' or 'unknown', these are risky. Set \`hasGluten: true\`, \`confidence: 0.5\` for each, list "Unspecified [term]" (e.g., "Unspecified thickener"). If product has 'aoecs' or 'gf_text' label, assume these are GF compliant.

5.  **Default to Safe:** If none of the above conditions set \`hasGluten: true\`, then set \`hasGluten: false\`.
    *   If labelingInfo is 'aoecs' or 'gf_text': \`confidence: 0.9-1.0\`.
    *   If labelingInfo is 'none' or 'unknown' but ingredients otherwise appear safe (and no uncertified oats): \`confidence: 0.7-0.8\` (reflecting unaddressed general contamination risk). If uncertified oats were the *only* issue and somehow this step is reached (which shouldn't happen due to rule 2), \`hasGluten\` should already be true.

**Reasoning:**
In the 'reason' field, explain your decision based on these rules, citing specific ingredients or phrases found. Mention how labelingInfo (e.g., 'aoecs', 'gf_text', 'none') influenced the decision. Ensure notes about oats (as per rule 2) are included if oats are present.

**Milk Allergens (Secondary Task):**
After gluten analysis, also check for common milk allergens (e.g., milk, lactose, whey, casein, milk proteins, cream, butter, cheese, mleko, surutka, kazein, pavlaka, maslac, sir). Include any findings in the 'reason' field as a *separate note* from the gluten analysis. For example: "Note on milk: Contains milk powder." This does NOT affect the \`hasGluten\` status.

**Examples for Oats:**
*   Input: \`declarationText: "oats, sugar, cinnamon"\`, \`labelingInfo: "none"\`
    Expected output part: \`hasGluten: true\`, \`glutenIngredients: ["Uncertified/unlabeled oats"]\`, \`reason: "Uncertified/unlabeled oats are present and considered risky due to potential cross-contamination. ..."\`
*   Input: \`declarationText: "certified gluten-free oats, honey, salt"\`, \`labelingInfo: "gf_text"\`
    Expected output part: \`hasGluten: false\`, \`reason: "...Note on Oats: This product contains certified/labeled gluten-free oats. While generally safe for most individuals with celiac disease, a small percentage of celiacs may also be sensitive to avenin, a protein naturally found in oats. Consult with a healthcare professional if you have concerns about consuming oats."\` (assuming no other gluten sources)

Product Declaration to Analyze:
\`{{{declarationText}}}\`
Labeling Information: \`{{{labelingInfo}}}\`
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
    
