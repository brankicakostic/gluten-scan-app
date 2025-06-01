
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
  reason: z.string().describe('The reasoning behind the gluten detection result.'),
});
export type AnalyzeDeclarationOutput = z.infer<typeof AnalyzeDeclarationOutputSchema>;

export async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
  return analyzeDeclarationFlow(input);
}

const analyzeDeclarationPrompt = ai.definePrompt({
  name: 'analyzeDeclarationPrompt',
  input: {schema: AnalyzeDeclarationInputSchema},
  output: {schema: AnalyzeDeclarationOutputSchema},
  prompt: `You are a helpful AI assistant specializing in food ingredient analysis for individuals with Celiac disease,
  particularly in identifying gluten-containing ingredients. Your primary goal is to help users determine if a product is safe for them.

  Analyze the following product declaration (ingredient list) and determine if it likely contains gluten or trace ingredients.
  Provide a confidence score (0-1) indicating the certainty of your gluten detection.
  List any potential gluten-containing ingredients found in the declaration.
  Explain your reasoning for the gluten detection result.

  **Important Guide to Gluten-Containing and Risky Ingredients:**
  Please use this guide as a primary reference. Serbian terms are provided for accuracy.

  **Direktni Izvori Glutena (Direct Gluten Sources) - Assume these ALWAYS contain gluten unless explicitly stated otherwise (e.g., "gluten-free wheat starch"):**
  *   **Pšenica** (Wheat): Direktan izvor glutena.
  *   **Raž** (Rye): Direktan izvor glutena.
  *   **Ječam** (Barley): Direktan izvor glutena.
  *   **Spelta** (Spelt): Vrsta pšenice.
  *   **Kamut** (Kamut): Vrsta drevne pšenice.
  *   **Sojin sos** (Soy sauce): Većina sadrži pšenicu. Consider gluten-free ONLY if it's specifically labeled "tamari gluten-free" or "gluten-free soy sauce". Generic "sojin sos" ("Sojin sos" on its own) is a direct gluten source unless specified otherwise.
  *   **Slad** (Malt): Ječmeni slad (Barley malt). Direktan izvor glutena.
  *   **Ekstrakt slada** (Malt extract): Ječmeni ekstrakt (Barley extract). Direktan izvor glutena.

  **Rizični Sastojci (Risky Ingredients - may or may not contain gluten, assess carefully based on context and notes):**
  *   **Ovas** (Oats): Moguća kontaminacija ako nije sertifikovan kao bezglutenski. Prirodno bez glutena, ali skoro uvek kontaminiran bez sertifikata. Consider risky and likely containing gluten UNLESS it is explicitly certified/labeled as "bezglutenski ovas" (gluten-free oats).
  *   **Modifikovani skrob** (Modified starch - general term): Poreklo može biti pšenično. If the source is not specified (e.g., "modifikovani kukuruzni skrob" - modified corn starch is safe), assume it's risky. If it just says "modifikovani skrob" and could be from wheat, flag as risky.
  *   **Maltodekstrin**: Ako je iz pšenice, sadrži gluten. If the source is not specified (e.g., "maltodekstrin (kukuruzni)" - corn maltodextrin is safe), assume it's risky. "Maltodekstrin (pšenični)" contains gluten.
  *   **Dekstrin**: Ako je iz pšenice, sadrži gluten. If the source is not specified, assume it's risky. "Dekstrin (pšenični)" contains gluten.
  *   **Biljni protein** (Vegetable protein): Ponekad iz pšenice. If source is not specified, consider risky.
  *   **Biljna vlakna** (Vegetable fiber): Moguće pšenično poreklo. If source is not specified, consider risky.
  *   **Sirće** (Vinegar): Ako je sladno (malt vinegar) – sadrži gluten. Destilovano sirće (distilled vinegar) je obično bezbedno. If type is unclear, be cautious.
  *   **Alkohol**: Ako je iz ječma (e.g., beer, some whiskies), it contains gluten. Destilovani alkohol (npr. votka, rum) može biti bez glutena ako je destilovan, UNLESS gluten-containing ingredients are added after distillation.
  *   **Arome** (Flavors - natural/artificial, "prirodne/veštačke"): Moguće prisustvo slada. Mogu sadržati ječam, slad, pšenične derivate. If not specified as gluten-free, consider risky.
  *   **Ekstrakt kvasca** (Yeast extract): Moguće tragove glutena. If product is not certified gluten-free, consider yeast extract risky.
  *   **Mladi ječam** (Young barley/barley grass): List biljke, bez glutena samo ako nije klasao i ako je testiran (gluten-free only if harvested before jointing and certified gluten-free). Otherwise, assume products with "ječam" contain gluten.
  *   **Pojačivači ukusa i arome (Flavor enhancers and aromas) - Consider risky:**
      *   E620 glutaminska kiselina (Glutamic acid)
      *   E621 mononatrijumov glutaminat (Monosodium glutamate - MSG)
      *   E622 monokalijumov glutamat (Monopotassium glutamate)
      *   E623 kalcijumov diglutaminat (Calcium diglutamate)
      *   E624 monoamonijumov glutaminat (Monoammonium glutamate)
      *   E625 magnezijumov diglutaminat (Magnesium diglutamate)
  *   **Specifični skrobovi (Specific starches) - Consider these risky as their source might be wheat unless specified otherwise (e.g., "pšenični skrob" contains gluten, "kukuruzni skrob" is safe). If origin is not specified, be cautious:**
      *   E1404 oksidovani skrob (Oxidized starch)
      *   E1410 monoskrobni fosfat (Monostarch phosphate)
      *   E1412 diskrobni fosfat (Distarch phosphate)
      *   E1413 fosforilisani diskrobni fosfat (Phosphated distarch phosphate)
      *   E1414 acetilovani diskrobni fosfat (Acetylated distarch phosphate)
      *   E1420 acetilovani skrob (Acetylated starch)
      *   E1422 acetilovani diskrobni adipat (Acetylated distarch adipate)
      *   E1440 hidroksipropil skrob (Hydroxypropyl starch)
      *   E1442 hidroksipropil diskrobni fosfat (Hydroxypropyl distarch phosphate)
      *   (Note: Other modified starches not listed here, like E1450 or E1451, should also be considered risky if their source, e.g. wheat, is not specified as gluten-free).
  *   **Antioksidanti (Antioxidants) - Consider risky if source not specified:**
      *   E575 glukono-delta-lakton (Glucono delta-lactone) - Can be derived from wheat or corn. Risky if source is unknown.
  *   **Veštačke boje - Karamel boje (Artificial colors - Caramel colors) - Can be derived from gluten-containing grains (like wheat or barley). Consider risky unless specified as derived from a gluten-free source or if the product is certified gluten-free:**
      *   E150a (Plain Caramel / Caustic caramel)
      *   E150b (Caustic sulphite caramel)
      *   E150c (Ammonia caramel)
      *   E150d (Sulphite ammonia caramel)

  **General Approach:**
  *   If an ingredient is listed as 'Direktni Izvori Glutena', set 'hasGluten' to true and list it in 'glutenIngredients'.
  *   If an ingredient is 'Rizični', assess based on the notes and context. If the origin is not specified as gluten-free, or if there's a strong likelihood of gluten (e.g., generic 'maltodekstrin' without source, or an E-number listed above without a confirmed GF source), lean towards caution: set 'hasGluten' to true and list it.
  *   If a product contains 'Ovas' (oats) and is NOT explicitly certified gluten-free, set 'hasGluten' to true due to high risk of cross-contamination.
  *   Confidence should be high (e.g., 0.9-1.0) if direct gluten sources are found or if uncertified oats are present. For other risky ingredients where origin is ambiguous or for the listed E-numbers, confidence might be moderate (e.g., 0.6-0.8). If no risky ingredients are found, confidence for 'likely gluten-free' should also be high.
  *   Your 'reason' should clearly explain which ingredients led to the determination.

  Product Declaration:
  {{{declarationText}}}`,
});

const analyzeDeclarationFlow = ai.defineFlow(
  {
    name: 'analyzeDeclarationFlow',
    inputSchema: AnalyzeDeclarationInputSchema,
    outputSchema: AnalyzeDeclarationOutputSchema,
  },
  async input => {
    const {output} = await analyzeDeclarationPrompt(input);
    // Ensure confidence is within 0-1 range, clamp if necessary
    if (output && output.confidence < 0) output.confidence = 0;
    if (output && output.confidence > 1) output.confidence = 1;
    return output!;
  }
);

    
