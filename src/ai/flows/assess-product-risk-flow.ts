'use server';
/**
 * @fileOverview A Genkit flow to assess the risk of a food product for individuals with celiac disease.
 *
 * - assessProductRisk - A function that takes product details and returns a risk assessment.
 * - AssessProductRiskInput - The input type for the assessProductRisk function.
 * - AssessProductRiskOutput - The return type for the assessProductRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AssessProductRiskInputSchema = z.object({
  name: z.string().describe("Naziv proizvoda."),
  gfLabelOnPackaging: z.boolean().describe("Da li proizvod ima vidljivu gluten-free oznaku na pakovanju?"),
  labTestPerformed: z.boolean().describe("Da li je urađen laboratorijski test na gluten?"),
  labTestResultPpm: z.number().nullable().optional().describe("Rezultat laboratorijskog testa u ppm (delova na milion). Null ako test nije rađen ili rezultat nije poznat."),
  hasLicenseOrCert: z.boolean().describe("Da li proizvod poseduje licencu ili sertifikat (npr. AOECS)?"),
  verifiedByCeliacAssociation: z.boolean().describe("Da li je proizvod verifikovan od strane udruženja celijakičara?"),
  ingredientsList: z.array(z.string()).describe("Lista sastojaka proizvoda. Svaki sastojak kao poseban string u nizu."),
  manufacturerStatementProvided: z.boolean().describe("Da li postoji izjava proizvođača o (ne)prisustvu glutena?"),
  manufacturerStatementClaimsGF: z.boolean().optional().describe("Ako postoji izjava proizvođača, da li tvrdi da je proizvod bez glutena? Relevantno samo ako je manufacturerStatementProvided true."),
  additionalNotes: z.string().optional().describe("Dodatne napomene o proizvodu, npr. tekst sa deklaracije kao što je 'može sadržati tragove glutena', 'proizvedeno u pogonu gde se koristi pšenica' itd."),
});
export type AssessProductRiskInput = z.infer<typeof AssessProductRiskInputSchema>;

export const AssessProductRiskOutputSchema = z.object({
  riskLevel: z.enum(["GREEN", "YELLOW", "RED"]).describe("Procena nivoa rizika: GREEN (bezbedan), YELLOW (potrebna dodatna provera), RED (rizičan/sadrži gluten)."),
  reasoning: z.string().describe("Obrazloženje za dodeljeni nivo rizika."),
});
export type AssessProductRiskOutput = z.infer<typeof AssessProductRiskOutputSchema>;

export async function assessProductRisk(input: AssessProductRiskInput): Promise<AssessProductRiskOutput> {
  return assessProductRiskFlow(input);
}

const assessProductRiskPrompt = ai.definePrompt({
  name: 'assessProductRiskPrompt',
  input: {schema: AssessProductRiskInputSchema},
  output: {schema: AssessProductRiskOutputSchema},
  prompt: `Ocenjuješ proizvode za upotrebu u aplikaciji za osobe koje izbegavaju gluten. Zamisli da si nutricionista – objektivan, pažljiv, ali ne paničan.

Zadatak ti je da analiziraš prehrambeni proizvod na osnovu datih informacija i proceniš njegov rizik za osobu sa celijakijom.
Vrati ocenu rizika kao jednu od sledećih vrednosti za 'riskLevel': GREEN, YELLOW, ili RED.
U polje 'reasoning' unesi detaljno obrazloženje svoje odluke.

Kriterijumi za procenu:
1.  'gfLabelOnPackaging': Da li proizvod ima gluten-free oznaku na pakovanju?
2.  'labTestPerformed' i 'labTestResultPpm': Da li postoji laboratorijski test i koji je rezultat u ppm?
3.  'hasLicenseOrCert': Da li postoji licenca ili sertifikat (npr. AOECS)?
4.  'verifiedByCeliacAssociation': Da li se nalazi na spisku udruženja celijakičara?
5.  'ingredientsList': Da li sadrži rizične sastojke? Proveri svaki sastojak.
6.  'manufacturerStatementProvided' i 'manufacturerStatementClaimsGF': Da li postoji izjava proizvođača i da li tvrdi da je proizvod GF?
7.  'additionalNotes': Ima li napomena poput "može sadržati tragove glutena"?

Referentne liste sastojaka:
Opasni Sastojci (Direktni izvori glutena - vode u RED ako se pronađu, osim ako postoji validan AOECS sertifikat koji ih eksplicitno pokriva kao prerađene na bezbedan način):
  - pšenica (i svi derivati osim dole navedenih izuzetaka)
  - ječam (i svi derivati poput ječmenog slada, osim dole navedenih izuzetaka)
  - raž (i svi derivati osim dole navedenih izuzetaka)
  - spelta
  - kuskus
  - durum
  - glutenin
  - gliadin
  - kamut
  - triticale
  - bulgur
  - griz pšenični (ako nije deklarisan kao bezglutenski)
  - pšenični skrob (ako nije deklarisan kao bezglutenski i ne podleže izuzecima)
  - ječmeni slad (ekstrakt slada)
  - sojin sos (osim ako je deklarisan kao 'tamari bez glutena' ili 'bezglutenski sojin sos')

Skriveni/Rizični Sastojci (Mogu ukazivati na YELLOW ili RED ako nema jakih GF potvrda):
  - glukozni sirup (ako nije eksplicitno navedeno da je na bazi kukuruza, pirinča, krompira ili pšenice/ječma prema 'Dozvoljeni Izuzeci')
  - maltodekstrin (ako nije eksplicitno navedeno da je na bazi kukuruza, pirinča, krompira ili pšenice prema 'Dozvoljeni Izuzeci')
  - dekstroza (ako nije eksplicitno navedeno da je na bazi kukuruza, pirinča, krompira ili pšenice prema 'Dozvoljeni Izuzeci')
  - prirodna aroma / aroma (mogu sadržati gluten nosače)
  - biljni protein / hidrolizovani biljni protein (ako izvor nije naveden kao bezglutenski)
  - modifikovani skrob (ako izvor nije naveden kao bezglutenski, npr. kukuruzni, krompirov, tapioka)
  - dekstrin (ako izvor nije naveden kao bezglutenski)
  - ekstrakt kvasca (može imati tragove glutena)
  - sirće (sladno sirće sadrži gluten; destilovano je obično OK)
  - alkohol (neki mogu biti od žitarica koje sadrže gluten, pre destilacije)

Rizični E-Brojevi (Mogu ukazivati na YELLOW ili RED ako nema jakih GF potvrda, a izvor nije specificiran kao bezglutenski):
  - Pojačivači ukusa: E620, E621, E622, E623, E624, E625
  - Skrobovi: E1404, E1410, E1412, E1413, E1414, E1420, E1422, E1440, E1442 (i drugi E14xx ako izvor nije GF)
  - Antioksidanti: E575 (glukono-delta-lakton - može biti od pšenice)
  - Karamel boje: E150a, E150b, E150c, E150d (mogu biti od gluten žitarica)

Dozvoljeni Izuzeci (Ovi sastojci, iako izvedeni iz glutenskih žitarica, smatraju se bezbednim i NE TREBA da sami po sebi vode ka RED ili YELLOW ako su jedini potencijalni problem):
  - glukozni sirup na bazi pšenice (uključujući i dekstrozu)
  - maltodekstrin na bazi pšenice
  - dekstroza na bazi pšenice
  - glukozni sirup na bazi ječma
  - žitni destilati ili etil alkohol poljoprivrednog porekla za proizvodnju jakih alkoholnih pića dobijenih iz žita

Neutralni Sastojci (Generalno bezbedni, ali uvek proveriti ceo kontekst):
  - pirinač, kukuruz, proso, amarant, kinoa, heljda, leblebija, tapioka skrob, kukuruzni skrob, krompirov skrob, guar guma, ksantan guma.

Ovas (Zob):
  - Prirodno ne sadrži gluten ali je često kontaminiran. Sadrži avenin koji kod nekih izaziva reakciju.
  - Smatraj ga RIZIČNIM (RED) osim ako je proizvod eksplicitno sertifikovan kao bezglutenski sa bezglutenskim ovasom (npr. 'hasLicenseOrCert' je true i odnosi se na GF ovas, ili 'gfLabelOnPackaging' je pouzdana GF oznaka koja pokriva ovas).

Posebna pažnja za osetljive osobe (ako postoji GF oznaka/sertifikat):
Ako proizvod ima jasnu GF oznaku ('gfLabelOnPackaging' je true) ili sertifikat ('hasLicenseOrCert' je true), ALI 'ingredientsList' sadrži sastojke kao što su 'maltodekstrin', 'dekstroza', ili 'glukozni sirup' BEZ navedenog bezglutenskog porekla (npr. NIJE 'maltodekstrin (pšenični)', 'dekstroza (pšenična)' koji su dozvoljeni izuzeci):
  - `riskLevel` bi generalno trebalo da ostane GREEN zbog zvanične GF potvrde.
  - U 'reasoning', OBAVEZNO dodaj napomenu: "Proizvod poseduje zvaničnu gluten-free potvrdu. Sadrži [navedi_sastojak_poput_maltodekstrina] čije poreklo nije specificirano. Iako je proizvod sertifikovan kao bezglutenski, osobe sa izuzetno visokom osetljivošću na gluten mogu želeti da obrate pažnju na ovu informaciju." Primer: "Proizvod poseduje zvaničnu gluten-free potvrdu. Sadrži maltodekstrin čije poreklo nije specificirano. Iako je proizvod sertifikovan kao bezglutenski, osobe sa izuzetno visokom osetljivošću na gluten mogu želeti da obrate pažnju na ovu informaciju."
  - Nemoj automatski oceniti kao YELLOW ili RED samo zbog ovoga ako postoji jaka GF potvrda, osim ako postoje drugi jači negativni faktori koji bi to opravdali (npr. dodatna napomena "proizvedeno u pogonu gde se koristi pšenica" a da nije AOECS).

Logika za određivanje 'riskLevel':

1.  STROGO RED AKO:
    *   Bilo koji sastojak iz 'Opasni Sastojci' je nađen u 'ingredientsList'. Navedi koji.
    *   'labTestPerformed' je true I 'labTestResultPpm' > 20. Navedi rezultat.
    *   'ingredientsList' sadrži "ovas" ili "zob" A NIJE zadovoljen uslov za bezbedan ovas (nema 'hasLicenseOrCert' ili pouzdane 'gfLabelOnPackaging' koja eksplicitno potvrđuje bezglutenski ovas).

2.  STROGO GREEN AKO (i nijedan RED uslov nije ispunjen):
    *   'hasLicenseOrCert' je true (npr. AOECS sertifikat). Obrazloženje treba da navede sertifikat kao glavni razlog. Čak i ako postoje 'additionalNotes' o tragovima, AOECS sertifikat obično pokriva ovo. Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
    *   'labTestPerformed' je true I 'labTestResultPpm' <= 20 (idealno <= 10 ppm). Navedi rezultat. Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
    *   'gfLabelOnPackaging' je true (npr. "precrtana pšenica" koja implicira AOECS ili slično pouzdano) I nema konfliktnih informacija (npr. opasnih sastojaka koji nisu pokriveni izuzecima). Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.

3.  KOMBINOVANA PROCENA (ako nema strogih RED ili GREEN):
    *   Ako 'additionalNotes' ili 'ingredientsList' sadrži fraze poput "može sadržati tragove glutena", "proizvedeno u objektu gde se koristi gluten", "sadrži tragove pšenice/ječma/raži":
        *   Ako proizvod ima 'hasLicenseOrCert' (AOECS), onda je GREEN (jer AOECS to dozvoljava unutar standarda, ali i dalje primeni "Posebna pažnja za osetljive osobe" ako je relevantno).
        *   Inače, ovo vodi ka YELLOW. Obrazloži da je zbog upozorenja o tragovima.
    *   Ako je 'verifiedByCeliacAssociation' true:
        *   Ako su svi sastojci u 'ingredientsList' sa liste 'Neutralni Sastojci' ili su jasno bezopasni (npr. "suncokretovo ulje", "so", "šećer") I nema upozorenja o tragovima -> GREEN. Obrazloži da je na listi udruženja i sastojci su čisti. Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
        *   Inače (npr. nema drugih jakih GF potvrda poput labela/licence, ili sastojci nisu svi trivijalno sigurni) -> YELLOW. Obrazloži kao u primeru: "Na spisku udruženja, ali bez drugih jakih potvrda. Sastojci deluju bezbedno, ali je potrebna opreznost/provera."
    *   Ako je 'manufacturerStatementProvided' true I 'manufacturerStatementClaimsGF' true:
        *   Ako su svi sastojci u 'ingredientsList' sa liste 'Neutralni Sastojci' ili jasno bezopasni I nema upozorenja o tragovima -> GREEN. Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
        *   Ako 'ingredientsList' sadrži 'Skriveni/Rizični Sastojci' ili 'Rizični E-Brojevi' koji NISU pokriveni 'Dozvoljeni Izuzeci' -> YELLOW. Obrazloži da proizvođač tvrdi GF, ali neki sastojci (navedi koji) zahtevaju pažnju. Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
    *   Ako je 'gfLabelOnPackaging' true (ali nije potvrđena kao AOECS kroz 'hasLicenseOrCert'):
        *   Ako su svi sastojci u 'ingredientsList' sa liste 'Neutralni Sastojci' ili jasno bezopasni I nema upozorenja o tragovima -> GREEN (uz napomenu da se oslanja na oznaku proizvođača). Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
        *   Ako 'ingredientsList' sadrži 'Skriveni/Rizični Sastojci' ili 'Rizični E-Brojevi' koji NISU pokriveni 'Dozvoljeni Izuzeci' -> YELLOW. Primeniti pravilo "Posebna pažnja za osetljive osobe" ako je relevantno.
    *   Ako NEMA eksplicitnih GF tvrdnji (sva relevantna boolean polja su false):
        *   Ako 'ingredientsList' sadrži 'Skriveni/Rizični Sastojci' (uključujući generički maltodekstrin, dekstrozu, glukozni sirup) ili 'Rizični E-Brojevi' -> YELLOW ili RED (ako je sastojak veoma sumnjiv). Obrazloži.
        *   Ako su svi sastojci u 'ingredientsList' sa liste 'Neutralni Sastojci' ili deluju bezopasno -> YELLOW. Obrazloži da nema GF potvrda i da postoji rizik od kontaminacije iako sastojci deluju OK.

Obavezno navedi ključne faktore iz ulaza koji su doveli do tvoje odluke u 'reasoning'. Uvek primeni pravilo "Posebna pažnja za osetljive osobe" kada je 'riskLevel' GREEN a relevantni sastojci su prisutni.

Primer ulaza:
{
  "name": "Keks sa prosojem",
  "gfLabelOnPackaging": false,
  "labTestPerformed": false,
  "labTestResultPpm": null,
  "hasLicenseOrCert": false,
  "verifiedByCeliacAssociation": true,
  "ingredientsList": ["proso", "kukuruzno brašno", "suncokretovo ulje"],
  "manufacturerStatementProvided": false,
  "additionalNotes": null
}
Očekivani odgovor za primer ulaza:
{
  "riskLevel": "YELLOW",
  "reasoning": "Proizvod je na spisku udruženja celijakičara, što je pozitivan znak. Sastojci ('proso', 'kukuruzno brašno', 'suncokretovo ulje') generalno se smatraju bezbednim. Međutim, nema gluten-free oznake na pakovanju, nije naveden laboratorijski test, nema licence/sertifikata, niti izjave proizvođača. Zbog nedostatka dodatnih potvrda i potencijalnog rizika od unakrsne kontaminacije koji nije eksplicitno adresiran, preporučuje se dodatna provera ili oprez."
}

Sada analiziraj sledeći proizvod:
Ime: {{{name}}}
Oznaka GF na pakovanju: {{{gfLabelOnPackaging}}}
Testiran u laboratoriji: {{{labTestPerformed}}}
Rezultat testa (ppm): {{{labTestResultPpm}}}
Licenca/Sertifikat: {{{hasLicenseOrCert}}}
Verifikovan od udruženja: {{{verifiedByCeliacAssociation}}}
Sastojci: {{{ingredientsList}}}
Izjava proizvođača postoji: {{{manufacturerStatementProvided}}}
Izjava proizvođača tvrdi GF: {{{manufacturerStatementClaimsGF}}}
Dodatne napomene: {{{additionalNotes}}}
`,
});

const assessProductRiskFlow = ai.defineFlow(
  {
    name: 'assessProductRiskFlow',
    inputSchema: AssessProductRiskInputSchema,
    outputSchema: AssessProductRiskOutputSchema,
  },
  async (input) => {
    // Helper to ensure ingredientsList is always an array for the prompt
    const promptInput = {
      ...input,
      ingredientsList: Array.isArray(input.ingredientsList) ? input.ingredientsList.join(', ') : '',
      labTestResultPpm: input.labTestResultPpm === undefined ? null : input.labTestResultPpm,
      additionalNotes: input.additionalNotes === undefined ? null : input.additionalNotes,
      manufacturerStatementClaimsGF: input.manufacturerStatementClaimsGF === undefined ? null : input.manufacturerStatementClaimsGF,
    };
    const {output} = await assessProductRiskPrompt(promptInput);
    return output!;
  }
);

    

    

      