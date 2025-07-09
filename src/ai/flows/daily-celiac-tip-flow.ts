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
  summary: z.string().describe('Kratak, zanimljiv sažetak saveta ili činjenice o celijakiji (1-2 rečenice) na SRPSKOM. Ovo nije medicinski savet.'),
  details: z.string().describe('Detaljnije objašnjenje saveta (2-4 rečenice) na SRPSKOM. Ovaj odeljak mora da sadrži podsetnik da ove informacije nisu medicinski savet i da korisnici treba da se konsultuju sa zdravstvenim radnikom za medicinske probleme.'),
});
export type DailyCeliacTipOutput = z.infer<typeof DailyCeliacTipOutputSchema>;

export async function getDailyCeliacTip(): Promise<DailyCeliacTipOutput> {
  return dailyCeliacTipFlow();
}

const dailyCeliacTipPrompt = ai.definePrompt({
  name: 'dailyCeliacTipPrompt',
  output: {schema: DailyCeliacTipOutputSchema},
  prompt: `Ti si AI asistent koji pruža korisne informacije o celijakiji.
Generiši "Dnevni Savet" ili "Da li ste znali?" činjenicu o celijakiji, na SRPSKOM JEZIKU.
Sadržaj treba da se sastoji iz dva dela:
1. 'summary': Kratak, zanimljiv sažetak saveta (1-2 rečenice).
2. 'details': Detaljnije objašnjenje saveta (2-4 rečenice).

Ključno je da u 'details' deo uključiš podsetnik da ove informacije nisu medicinski savet i da se pojedinci trebaju konsultovati sa zdravstvenim radnicima za sve zdravstvene probleme.

Primer:
Summary: "Da li ste znali? Alkohol, kao što je 70% etanol, ne uništava uvek gluten na površinama. Potrebna je dodatna pažnja prilikom čišćenja i kod nekih pića."
Details: "Iako je 70% alkohol dobar dezinficijens, možda neće u potpunosti denaturisati ili ukloniti proteine glutena sa površina, zbog čega je temeljno čišćenje sapunom i vodom neophodno za osobe sa celijakijom. Takođe, budite oprezni sa nekim alkoholnim pićima, posebno likerima ili aromatizovanim pićima, jer mogu sadržati aditive na bazi glutena. Uvek proverite etikete ili kontaktirajte proizvođača. Ove informacije nisu medicinski savet; molimo vas da se konsultujete sa zdravstvenim radnikom za dijetetske smernice."

Obezbedi izlaz u navedenim poljima 'summary' i 'details'.`,
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
