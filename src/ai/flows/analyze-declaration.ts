
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
  reason: z.string().describe('The reasoning behind the gluten detection result, including notes on milk allergens if present.'),
});
export type AnalyzeDeclarationOutput = z.infer<typeof AnalyzeDeclarationOutputSchema>;

export async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
  return analyzeDeclarationFlow(input);
}

const analyzeDeclarationPrompt = ai.definePrompt({
  name: 'analyzeDeclarationPrompt',
  input: {schema: AnalyzeDeclarationInputSchema},
  output: {schema: AnalyzeDeclarationOutputSchema},
  prompt: `You are a highly specialized AI assistant for Celiac disease, focusing on analyzing food ingredient lists (declarations) in Serbian to detect gluten.
  Your goal is to determine if a product is safe for individuals with Celiac disease based ONLY on the provided ingredient list.

  **Primary Reference for Gluten-Containing and Risky Ingredients (Serbian):**

  **1. Direktni Izvori Glutena (Opasni Sastojci - Direct Gluten Sources):**
  Assume these ALWAYS contain gluten unless explicitly stated otherwise (e.g., 'gluten-free wheat starch').
  *   **Pšenica** (Wheat)
  *   **Raž** (Rye)
  *   **Ječam** (Barley)
  *   **Spelta** (Spelt)
  *   **Kamut** (Kamut)
  *   **Sojin sos** (Soy sauce): Most contain wheat. Consider gluten-free ONLY if specifically labeled 'tamari gluten-free' or 'gluten-free soy sauce'. Generic 'sojin sos' is a direct gluten source.
  *   **Slad** (Malt): Includes **Ječmeni slad** (Barley malt). Direct gluten source.
  *   **Ekstrakt slada** (Malt extract): Barley extract. Direct gluten source.
  *   **Kuskus** (Couscous): Made from wheat.
  *   **Durum** (Durum wheat)
  *   **Glutenin** (Glutenin - a gluten protein)
  *   **Gliadin** (Gliadin - a gluten protein)

  **2. Rizični Sastojci (Risky Ingredients - may or may not contain gluten):**
  Assess carefully based on context, notes, and whether the source is specified.
  *   **Ovas (Zob - Oats):**
      *   *Napomena:* Oats are naturally gluten-free but very often contaminated during processing if not certified gluten-free. They also contain avenin, to which some Celiacs react.
      *   *Sigurna Upotreba:* Only if explicitly stated as 'sertifikovan bezglutenski ovas' (certified gluten-free oats) or if the product itself carries a reliable gluten-free certification (like AOECS Crossed Grain symbol mentioned in text). Otherwise, consider uncertified oats as containing gluten due to high contamination risk.
  *   **Modifikovani skrob** (Modified starch - general term): Risky if the source (e.g., pšenični - wheat) is not specified as gluten-free (e.g., 'modifikovani kukuruzni skrob' - modified corn starch is safe).
  *   **Glukozni sirup** (Glucose syrup - generic term): Risky if the source is not specified (see exceptions below).
  *   **Maltodekstrin** (Maltodextrin - generic term): Risky if the source is not specified (see exceptions below).
  *   **Dekstrin** (Dextrin - generic term): Risky if the source not specified. 'Dekstrin (pšenični)' contains gluten.
  *   **Biljni protein** (Vegetable protein): Can be from wheat. Risky if source not specified.
  *   **Biljna vlakna** (Vegetable fiber): Possible wheat origin. Risky if source not specified.
  *   **Sirće** (Vinegar): Malt vinegar ('sladno sirće') contains gluten. Distilled vinegar is usually safe. If type is unclear, be cautious.
  *   **Alkohol** (Alcohol): If from barley (e.g., beer, some whiskies), it contains gluten (see exceptions for distillates below).
  *   **Arome / Prirodna aroma** (Flavors - natural/artificial): Can contain barley, malt, wheat derivatives. Risky if not specified as gluten-free.
  *   **Ekstrakt kvasca** (Yeast extract): Possible trace gluten. Risky if product not certified gluten-free.
  *   **Mladi ječam** (Young barley/barley grass): Gluten-free only if harvested before jointing and certified. Assume products with 'ječam' contain gluten.
  *   **Rizični E-Brojevi (Risky E-Numbers):**
      *   *Pojačivači ukusa i arome (Flavor Enhancers):* E620 (glutaminska kiselina), E621 (mononatrijumov glutaminat - MSG), E622 (monokalijumov glutamat), E623 (kalcijumov diglutaminat), E624 (monoamonijumov glutaminat), E625 (magnezijumov diglutaminat).
      *   *Specifični Skrobovi (Specific Starches - risky if source not specified as non-gluten, e.g., 'pšenični skrob' has gluten, 'kukuruzni skrob' is safe):* E1404 (oksidovani skrob), E1410 (monoskrobni fosfat), E1412 (diskrobni fosfat), E1413 (fosforilisani diskrobni fosfat), E1414 (acetilovani diskrobni fosfat), E1420 (acetilovani skrob), E1422 (acetilovani diskrobni adipat), E1440 (hidroksipropil skrob), E1442 (hidroksipropil diskrobni fosfat). (Other modified starches like E1450, E1451 are also risky if source not specified GF).
      *   *Antioksidanti (Antioxidants):* E575 (glukono-delta-lakton) - Can be from wheat or corn. Risky if source unknown.
      *   *Veštačke boje - Karamel boje (Artificial Colors - Caramel Colors):* E150a (Plain Caramel), E150b (Caustic sulphite caramel), E150c (Ammonia caramel), E150d (Sulphite ammonia caramel). Risky if derived from gluten grains and not specified GF.

  **3. Dozvoljeni Izuzeci / Važne Napomene o Prerađenim Sastojcima Iz Žitarica (Permitted Exceptions / Important Notes on Processed Ingredients from Cereals):**
  These ingredients, though derived from gluten grains, are generally considered safe for Celiacs due to processing that removes gluten, or are exempt from allergen labeling. **Their presence ALONE should NOT make the product 'hasGluten: true'.**
  *   **Glukozni sirup na bazi pšenice, uključujući i dekstrozu** (Wheat-based glucose syrup, including dextrose).
  *   **Maltodekstrin na bazi pšenice** (Wheat-based maltodextrin). *If "maltodekstrin" without "na bazi pšenice" is listed and product is not certified GF, treat as RIZIČNI SASTOJAK.*
  *   **Glukozni sirup na bazi ječma** (Barley-based glucose syrup).
  *   **Žitni destilati ili etil alkohol poljoprivrednog porekla za proizvodnju jakih alkoholnih pića dobijenih iz žita** (Cereal distillates or ethyl alcohol of agricultural origin for spirits from grains). *Applies to the spirit itself; gluten can be added post-distillation.*

  **4. Neutralni Sastojci (Generally Safe Ingredients):**
  These are generally considered safe: Pirinač (rice), Kukuruz (corn), Proso (millet), Amarant (amaranth), Kinoa (quinoa), Heljda (buckwheat), Leblebija (chickpea).

  **General Approach for Gluten Analysis:**
  1.  **Scan for Direktni Izvori Glutena:** If any are found, set 'hasGluten' to true, list them in 'glutenIngredients', set confidence high (0.9-1.0), and explain this in 'reason'.
  2.  **Assess Rizični Sastojci:**
      *   **Ovas (Oats):** If present and NOT explicitly 'sertifikovan bezglutenski ovas' (or product not described as certified gluten-free), set 'hasGluten' to true, list 'Ovas (nesertifikovan)' in 'glutenIngredients', high confidence.
      *   **Other Risky Ingredients (including E-numbers):** If a risky ingredient is found:
          *   Check if it's an exception under 'Dozvoljeni Izuzeci'. If yes, and it's the *only* potential issue, do not set 'hasGluten' to true solely based on this. Note it in 'reason'.
          *   If it's not an exception (e.g., generic 'modifikovani skrob', 'maltodekstrin' without specified non-gluten source, or a risky E-number without GF source clarification), set 'hasGluten' to true, list it in 'glutenIngredients'. Confidence may be moderate to high (0.6-0.9) depending on ambiguity.
  3.  **"Može sadržati tragove glutena" (May contain traces of gluten):** If this phrase (or similar like 'proizvedeno u objektu gde se koristi gluten') is explicitly in the 'declarationText', set 'hasGluten' to true, add 'Mogući tragovi glutena (navedeno na deklaraciji)' to 'glutenIngredients', set confidence high (0.9), and explain this is due to the advisory label.
  4.  **AOECS "Crossed Grain" Symbol:** If the 'declarationText' explicitly mentions the product has the "precrtana pšenica" (crossed grain) symbol or "AOECS certifikat", this strongly indicates it's gluten-free. In this case, even if some risky ingredients (that are not direct gluten sources) are listed, lean towards 'hasGluten: false' with high confidence, provided no *direct* gluten sources are listed. Mention the certification in the 'reason'.
  5.  **Confidence Score:**
      *   1.0 for clear, direct gluten sources.
      *   0.9-1.0 if uncertified oats are present or "may contain traces" is stated.
      *   0.6-0.8 for other risky ingredients if their presence leads to 'hasGluten: true'.
      *   If no direct gluten sources or significant unmitigated risky ingredients are found (especially if 'Neutralni Sastojci' are prominent or text mentions GF certification), 'hasGluten: false' should have high confidence (0.8-1.0).
  6.  **GlutenIngredients List:** Populate with specific ingredients identified as problematic.
  7.  **Reason Field:** Clearly explain the decision for gluten, citing specific ingredients and rules applied.

  **Analiza Mlečnih Alergena (Lactose and Casein Analysis):**
  Nakon analize glutena, takođe proveri sledeće mlečne alergene. Uključi relevantne napomene u 'reason' polje, PORED obrazloženja za gluten.

  *   **Izvori Laktoze (Lactose Sources):** Mleko (milk), svi mlečni derivati (all milk derivatives - unless specified lactose-free), surutka (whey), pavlaka (cream), mlečni šećer (milk sugar).
      *   Ako pronađeš izvore laktoze I deklaracija NE sadrži eksplicitno 'bez laktoze' (lactose-free): Dodaj u 'reason' napomenu poput: 'Napomena o laktozi: Sadrži sastojke koji su izvor laktoze (npr. mleko, pavlaka). Proizvod možda nije pogodan za osobe intolerantne na laktozu.'
      *   Ako deklaracija eksplicitno sadrži 'bez laktoze': Dodaj u 'reason' napomenu poput: 'Napomena o laktozi: Deklarisano kao bez laktoze. Ovo je generalno pogodno za osobe sa intolerancijom na mlečni šećer.'

  *   **Izvori Kazeina (Mlečni Proteini - Casein Sources):** Mleko (milk), mlečni proteini (milk proteins), surutka u prahu (whey powder), kazeinat (caseinate), mlečni koncentrat (milk concentrate).
      *   Ako pronađeš izvore kazeina: Dodaj u 'reason' napomenu poput: 'Napomena o kazeinu: Sadrži sastojke koji su izvor mlečnih proteina (kazeina, npr. mlečni proteini, kazeinat). Nije pogodno za osobe sa alergijom na mlečne proteine.'

  *   **Važno Upozorenje (Important Warning - if relevant):**
      *   Ako deklaracija eksplicitno sadrži 'bez laktoze' ALI su takođe pronađeni izvori kazeina: Dodaj u 'reason' napomenu poput: 'UPOZORENJE: Iako je proizvod deklarisan kao "bez laktoze", sadrži izvore kazeina (mlečnih proteina). Ovo može biti problematično za osobe sa alergijom na mlečne proteine, iako je laktoza uklonjena.'

  Tvoj primarni zadatak je i dalje detekcija glutena i popunjavanje 'hasGluten', 'glutenIngredients' i 'confidence'. Informacije o mlečnim alergenima su dodatne napomene za 'reason' polje.

  Product Declaration to Analyze:
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

