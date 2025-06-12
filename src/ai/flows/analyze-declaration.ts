
// This file uses server-side code.
'use server';

/**
 * @fileOverview Analyzes a product declaration (ingredient list) for potential gluten ingredients,
 * providing a per-ingredient assessment and an overall product safety evaluation.
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

const IngredientAssessmentSchema = z.object({
  sastojak: z.string().describe("Naziv analiziranog sastojka ili fraze iz deklaracije."),
  ocena: z.enum(["sigurno", "rizično – proveriti poreklo", "nije bezbedno"])
    .describe("Ocena bezbednosti sastojka: 'sigurno' (safe), 'rizično – proveriti poreklo' (risky - check origin), ili 'nije bezbedno' (not safe)."),
  napomena: z.string().optional().describe("Objašnjenje za ocenu sastojka (npr., zašto je rizičan, ili ako je uslovno siguran pod kojim uslovima).")
});

const AnalyzeDeclarationOutputSchema = z.object({
  rezultat: z.array(IngredientAssessmentSchema)
    .describe("Lista pojedinačno analiziranih sastojaka sa njihovim ocenama i napomenama."),
  ukupnaProcenaBezbednosti: z.enum(["sigurno", "rizično", "nije bezbedno", "potrebna pažnja"])
    .describe("Ukupna procena bezbednosti celog proizvoda na osnovu analize svih sastojaka: 'sigurno', 'rizično', 'nije bezbedno', 'potrebna pažnja' (safe, risky, not safe, caution needed)."),
  finalnoObrazlozenje: z.string()
    .describe("Kratko sumarno obrazloženje za ukupnu procenu bezbednosti, uključujući važne napomene (npr. o ovsu, mlečnim alergenima, ili uticaju GF oznaka)."),
  poverenjeUkupneProcene: z.number().min(0).max(1).describe("Poverenje u ukupnu ocenu (0-1).")
});
export type AnalyzeDeclarationOutput = z.infer<typeof AnalyzeDeclarationOutputSchema>;


export async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
  return analyzeDeclarationFlow(input);
}

const analyzeDeclarationPrompt = ai.definePrompt({
  name: 'analyzeDeclarationPrompt',
  input: {schema: AnalyzeDeclarationInputSchema},
  output: {schema: AnalyzeDeclarationOutputSchema},
  prompt: `Ti si AI asistent specijalizovan za analizu lista sastojaka prehrambenih proizvoda kako bi detektovao gluten, sa fokusom na bezbednost za osobe sa celijakijom.
Tvoj zadatak je da analiziraš dati 'declarationText' (listu sastojaka) i 'labelingInfo' (informacije o GF oznakama na pakovanju).
Na osnovu analize, treba da generišeš JSON objekat sa sledećom strukturom:
1.  'rezultat': Niz objekata. Svaki objekat predstavlja jedan analizirani sastojak ili frazu iz deklaracije i treba da sadrži:
    *   'sastojak': (string) Naziv analiziranog sastojka ili fraze.
    *   'ocena': (enum: "sigurno", "rizično – proveriti poreklo", "nije bezbedno") Procena bezbednosti tog sastojka.
    *   'napomena': (string, opciono) Objašnjenje za 'ocena' (npr. zašto je rizičan, ili ako je uslovno siguran pod kojim uslovima).
2.  'ukupnaProcenaBezbednosti': (enum: "sigurno", "rizično", "nije bezbedno", "potrebna pažnja") Ukupna procena bezbednosti celog proizvoda.
3.  'finalnoObrazlozenje': (string) Kratko sumarno obrazloženje za 'ukupnaProcenaBezbednosti', koje mora uključiti napomene o ovsu (ako je prisutan), mlečnim alergenima (ako su prisutni), i kako je 'labelingInfo' uticao na odluku.
4.  'poverenjeUkupneProcene': (broj, 0-1) Tvoje poverenje u 'ukupnaProcenaBezbednosti'.

Koristi sledeća pravila za analizu svakog sastojka i određivanje 'ocena':

**🔴 CRVENA LISTA (Zabranjeni sastojci):**
Ako je sastojak na ovoj listi, njegova 'ocena' je "nije bezbedno".
*   pšenica (uključujući pšenično brašno, pšenične bobice, durum, farina, graham, semolina, spelta, einkorn, emmer, kamut)
*   raž
*   ječam
*   tritikale
*   slad (sirup, ekstrakt, aroma) (osim ako je jasno navedeno da je bezglutenski i deo AOECS sertifikata)
*   pivski kvasac

**🟠 NARANDŽASTA LISTA (Uslovno dozvoljeni sastojci):**
*   Ako je 'labelingInfo' 'aoecs' ili 'gf_text', ILI ako je sastojak eksplicitno deklarisan kao bezglutenski (npr. "bezglutenski pšenični skrob"): 'ocena' je "sigurno", 'napomena' treba da objasni zašto (npr. "Smatra se bezbednim zbog GF oznake/sertifikata.").
*   Ako 'labelingInfo' nije 'aoecs' ili 'gf_text' (tj. 'none' ili 'unknown') I sastojak NIJE eksplicitno deklarisan kao bezglutenski: 'ocena' je "rizično – proveriti poreklo", 'napomena' treba da ukaže na potencijalni rizik (npr. "Poreklo/prerada nije potvrđena kao bezglutenska.").
    *   Primeri: pšenični skrob (ako nije deklarisan kao bezglutenski), karamel boja, dekstrin (ako nije jasno iz kukuruza/krompira), maltodekstrin (ako nije jasno iz kukuruza/krompira), prirodne arome, ekstrakt kvasca, aroma vanile (ne vanilin), glukozni sirup (ako izvor nije GF ili nije izuzetak po EU regulativi), modifikovani skrob (ako izvor nije GF).
    *   Specifično za "pšenični dekstrin" ili "dekstrin (pšenica)": ako nije jasno navedeno da je bezbedan za celijakiju (npr. obrađen da bude GF ili izuzetak), 'ocena' je "nije bezbedno". Ako je navedeno "dekstrin (kukuruzni)", onda je "sigurno".
    *   Specifično za "glukozni sirup (pšenica)" ili "maltodekstrin (pšenica)": prema EU regulativi, ovi su često bezbedni. Ako je 'labelingInfo' 'aoecs'/'gf_text', 'ocena' je "sigurno". Ako nema GF oznake, 'ocena' je "rizično – proveriti poreklo" uz napomenu da su često bezbedni ali da se preporučuje oprez bez potvrde.
    *   "Vanilin": Ako je naveden samo kao "vanilin", 'ocena' je "sigurno". Ako je "aroma vanile", primeni opšte pravilo za arome.
    *   Generički termini kao "zgušnjivač", "stabilizator", "emulgator": Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena' je "rizično – proveriti poreklo" sa napomenom "Potrebno proveriti poreklo [termina]". Ako je 'labelingInfo' 'aoecs' ili 'gf_text', 'ocena' je "sigurno".

**✅ ZELENA LISTA (Generalno bezbedni sastojci):**
'Ocena' je "sigurno".
*   Prirodno bezglutenske žitarice: pirinač, kukuruz, kinoa, proso, sirak, heljda, amarant, krompir, tapioka, aru prah, tef, juka.
*   Ostala prirodno bezglutenska hrana: meso, riba, jaja, mlečni proizvodi (osim sladnog mleka), povrće, voće, mahunarke, orašasti plodovi.
*   Čist vanilin ekstrakt, sintetički vanilin.
*   Zgušnjivač E415 (ksantan guma) je obično "sigurno". Sojin lecitin je "sigurno".

**🔍 RIZIČNE FRAZE (Ukazuju na moguću kontaminaciju):**
Ako je prisutna neka od sledećih fraza, dodaj je kao poseban 'sastojak' u 'rezultat' niz:
*   “može sadržati pšenicu/gluten” / “može sadržati tragove pšenice/glutena”
*   “proizvedeno na opremi koja se koristi i za proizvode sa pšenicom”
*   “proizvedeno u pogonu gde se prerađuje pšenica”
    *   'ocena' za ove fraze: "rizično – proveriti poreklo".
    *   'napomena': "Ukazuje na moguću unakrsnu kontaminaciju."
    *   Ove fraze utiču na 'ukupnaProcenaBezbednosti', čineći je "rizično" osim ako 'labelingInfo' nije 'aoecs' (u tom slučaju AOECS sertifikat može pokrivati ovaj rizik).

**🌿 OVAS (ZOB):**
*   Ako deklaracija sadrži "ovas" ili "zob" I ('labelingInfo' je 'none' ili 'unknown' ILI nije eksplicitno navedeno "bezglutenska zob" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Necertifikovana/neoznačena zob/ovas", 'ocena': "nije bezbedno", 'napomena': "Visok rizik od unakrsne kontaminacije. Nije bezbedno za celijakičare osim ako nije sertifikovano kao bezglutensko."}
*   Ako deklaracija sadrži "ovas" ili "zob" I ('labelingInfo' je 'aoecs' ili 'gf_text' ILI je eksplicitno navedeno "bezglutenska zob" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Sertifikovana/označena bezglutenska zob/ovas", 'ocena': "sigurno", 'napomena': "Smatra se bezbednim. Ipak, mala grupa celijakičara može biti osetljiva na avenin. Konsultovati lekara ako postoje nedoumice."}

**Određivanje 'ukupnaProcenaBezbednosti' i 'poverenjeUkupneProcene':**
1.  Ako bilo koji 'sastojak' u 'rezultat' nizu ima 'ocena: "nije bezbedno"' -> 'ukupnaProcenaBezbednosti: "nije bezbedno"'. 'poverenjeUkupneProcene': 0.9-1.0.
2.  Inače, ako postoji "Necertifikovana/neoznačena zob/ovas" sa 'ocena: "nije bezbedno"' -> 'ukupnaProcenaBezbednosti: "nije bezbedno"'. 'poverenjeUkupneProcene': 0.95.
3.  Inače, ako postoji RIZIČNA FRAZA sa 'ocena: "rizično – proveriti poreklo"' I 'labelingInfo' NIJE 'aoecs' -> 'ukupnaProcenaBezbednosti: "rizično"'. 'poverenjeUkupneProcene': 0.9.
4.  Inače, ako bilo koji 'sastojak' ima 'ocena: "rizično – proveriti poreklo"' -> 'ukupnaProcenaBezbednosti: "rizično"'. 'poverenjeUkupneProcene': 0.6-0.8 (više ako ima više takvih sastojaka).
5.  Inače, ako je prisutna "Sertifikovana/označena bezglutenska zob/ovas" (i sve ostalo je "sigurno") -> 'ukupnaProcenaBezbednosti: "potrebna pažnja"'. 'poverenjeUkupneProcene': 0.85. 'finalnoObrazlozenje' mora sadržati napomenu o osetljivosti na avenin.
6.  Inače (svi sastojci su "sigurno", nema rizičnih fraza koje nisu pokrivene AOECS-om):
    *   Ako je 'labelingInfo' 'aoecs' ili 'gf_text' -> 'ukupnaProcenaBezbednosti: "sigurno"'. 'poverenjeUkupneProcene': 0.9-1.0.
    *   Ako je 'labelingInfo' 'none' ili 'unknown' -> 'ukupnaProcenaBezbednosti: "sigurno"'. 'poverenjeUkupneProcene': 0.7-0.8 (zbog opšteg nedeklarisanog rizika).
7.  Ako je RIZIČNA FRAZA prisutna ALI 'labelingInfo' JE 'aoecs', i nema drugih problema, 'ukupnaProcenaBezbednosti' može biti "sigurno" ili "potrebna pažnja" uz napomenu da AOECS standardi mogu dozvoljavati takve izjave. 'poverenjeUkupneProcene': 0.8-0.9.

**'finalnoObrazlozenje':**
*   Mora sumirati zašto je proizvod dobio određenu 'ukupnaProcenaBezbednosti'.
*   Mora eksplicitno navesti uticaj 'labelingInfo'.
*   Ako je ovas/zob prisutan, uključi relevantnu napomenu (o riziku kontaminacije ili osetljivosti na avenin).
*   Ako su prisutni mlečni alergeni (npr. mleko, laktoza, surutka, kazein, kajmak, maslac, sir), dodaj napomenu na kraju, npr.: "Napomena o mleku: Sadrži mleko u prahu." Ovo ne utiče na procenu glutena.

**Primeri za AI:**
*   Ulaz: declarationText: "gluten-free wheat starch, sugar, salt", labelingInfo: "gf_text"
    Očekivani deo 'rezultat': [{"sastojak": "gluten-free wheat starch", "ocena": "sigurno", "napomena": "Deklarisano kao bezglutensko."}]
    Očekivana 'ukupnaProcenaBezbednosti': "sigurno"
*   Ulaz: declarationText: "ječmeni slad, šećer", labelingInfo: "none"
    Očekivani deo 'rezultat': [{"sastojak": "ječmeni slad", "ocena": "nije bezbedno", "napomena": "Ječam sadrži gluten."}]
    Očekivana 'ukupnaProcenaBezbednosti': "nije bezbedno"
*   Ulaz: declarationText: "pirinčano brašno, može sadržati tragove pšenice", labelingInfo: "none"
    Očekivani deo 'rezultat': [{"sastojak": "pirinčano brašno", "ocena": "sigurno"}, {"sastojak": "Fraza: može sadržati tragove pšenice", "ocena": "rizično – proveriti poreklo", "napomena": "Ukazuje na moguću unakrsnu kontaminaciju."}]
    Očekivana 'ukupnaProcenaBezbednosti': "rizično"

Lista sastojaka za analizu:
\`{{{declarationText}}}\`
Informacije o GF oznaci: \`{{{labelingInfo}}}\`
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
      labelingInfo: input.labelingInfo || 'unknown', 
    };
    const {output} = await analyzeDeclarationPrompt(promptInput);
    
    if (output && typeof output.poverenjeUkupneProcene === 'number') {
      output.poverenjeUkupneProcene = Math.max(0, Math.min(1, output.poverenjeUkupneProcene));
    } else if (output) {
      output.poverenjeUkupneProcene = 0.5; // Default ako nedostaje
    }
    return output!;
  }
);
    
