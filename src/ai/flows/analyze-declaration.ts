
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
  sastojak: z.string().describe("Naziv analiziranog sastojka ili fraze iz deklaracije (uvek na srpskom)."),
  ocena: z.enum(["sigurno", "rizično – proveriti poreklo", "nije bezbedno"])
    .describe("Ocena bezbednosti sastojka: 'sigurno' (safe), 'rizično – proveriti poreklo' (risky - check origin), ili 'nije bezbedno' (not safe)."),
  napomena: z.string().optional().describe("Objašnjenje za ocenu sastojka na srpskom (npr., zašto je rizičan, ili ako je uslovno siguran pod kojim uslovima).")
});

const AnalyzeDeclarationOutputSchema = z.object({
  rezultat: z.array(IngredientAssessmentSchema)
    .describe("Lista pojedinačno analiziranih sastojaka sa njihovim ocenama i napomenama (sve na srpskom)."),
  ukupnaProcenaBezbednosti: z.enum(["sigurno", "rizično", "nije bezbedno", "potrebna pažnja"])
    .describe("Ukupna procena bezbednosti celog proizvoda na osnovu analize svih sastojaka: 'sigurno', 'rizično', 'nije bezbedno', 'potrebna pažnja' (safe, risky, not safe, caution needed)."),
  finalnoObrazlozenje: z.string()
    .describe("Kratko sumarno obrazloženje za ukupnu procenu bezbednosti na srpskom, uključujući važne napomene (npr. o ovsu, mlečnim alergenima, ili uticaju GF oznaka)."),
  poverenjeUkupneProcene: z.number().min(0).max(1).describe("Poverenje u ukupnu ocenu (0-1).")
});
export type AnalyzeDeclarationOutput = z.infer<typeof AnalyzeDeclarationOutputSchema>;


async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
  return analyzeDeclarationFlow(input);
}

const analyzeDeclarationPrompt = ai.definePrompt({
  name: 'analyzeDeclarationPrompt',
  input: {schema: AnalyzeDeclarationInputSchema},
  output: {schema: AnalyzeDeclarationOutputSchema},
  prompt: `Ti si AI asistent specijalizovan za analizu lista sastojaka prehrambenih proizvoda kako bi detektovao gluten, sa fokusom na bezbednost za osobe sa celijakijom.
Tvoj zadatak je da analiziraš dati 'declarationText' (listu sastojaka) i 'labelingInfo' (informacije o GF oznakama na pakovanju).
Lista sastojaka ('declarationText') može biti na srpskom, hrvatskom, bosanskom ili engleskom jeziku. Prilagodi analizu jeziku na kojem je napisana lista. Svi nazivi sastojaka i obrazloženja u tvom odgovoru moraju biti na srpskom jeziku.

Na osnovu analize, treba da generišeš JSON objekat sa sledećom strukturom:
1.  'rezultat': Niz objekata. Svaki objekat predstavlja jedan analizirani sastojak ili frazu iz deklaracije i treba da sadrži:
    *   'sastojak': (string) Naziv analiziranog sastojka ili fraze (na srpskom).
    *   'ocena': (enum: "sigurno", "rizično – proveriti poreklo", "nije bezbedno") Procena bezbednosti tog sastojka.
    *   'napomena': (string, opciono) Objašnjenje za 'ocena' na srpskom (npr. zašto je rizičan, ili ako je uslovno siguran pod kojim uslovima).
2.  'ukupnaProcenaBezbednosti': (enum: "sigurno", "rizično", "nije bezbedno", "potrebna pažnja") Ukupna procena bezbednosti celog proizvoda.
3.  'finalnoObrazlozenje': (string) Kratko sumarno obrazloženje za 'ukupnaProcenaBezbednosti' na srpskom, koje mora uključiti napomene o ovsu (ako je prisutan), mlečnim alergenima (ako su prisutni), i kako je 'labelingInfo' uticao na odluku.
4.  'poverenjeUkupneProcene': (broj, 0-1) Tvoje poverenje u 'ukupnaProcenaBezbednosti'.

Koristi sledeća pravila za analizu svakog sastojka i određivanje 'ocena':

**🔴 CRVENA LISTA (Zabranjeni sastojci):**
Ako je sastojak na ovoj listi, njegova 'ocena' je "nije bezbedno".
*   pšenica (uključujući pšenično brašno, pšenične klice, durum, farina, graham, semolina, spelta, einkorn, emmer, kamut, wheat)
*   raž (rye)
*   ječam (barley)
*   tritikale (triticale)
*   Malt (uključujući malt extract, malt flavor, malt syrup, slad, ekstrakt slada, sladni sirup, aroma slada) (osim ako je izričito navedeno da je bezglutenski i deo AOECS sertifikata koji to pokriva)
*   pivski kvasac (brewer’s yeast)
*   pšenični skrob (wheat starch) - ako NIJE eksplicitno deklarisan kao "bezglutenski pšenični skrob" ILI ako proizvod nema 'aoecs'/'gf_text' oznaku koja pokriva ovaj sastojak.

**🟠 NARANDŽASTA LISTA (Opšti uslovno dozvoljeni sastojci):**
Ovi sastojci zahtevaju proveru 'labelingInfo' ili eksplicitnu GF deklaraciju na samom sastojku.
*   **Opšte pravilo za Narandžastu listu:**
    *   Ako je 'labelingInfo' 'aoecs' ili 'gf_text', ILI ako je sastojak eksplicitno deklarisan kao bezglutenski (npr. "dekstrin (kukuruzni)"): 'ocena' je "sigurno", 'napomena' treba da objasni zašto (npr. "Smatra se bezbednim zbog GF oznake/sertifikata.").
    *   Ako 'labelingInfo' NIJE 'aoecs' ili 'gf_text' (tj. 'none' ili 'unknown') I sastojak NIJE eksplicitno deklarisan kao bezglutenski: 'ocena' je "rizično – proveriti poreklo", 'napomena' treba da ukaže na potencijalni rizik (npr. "Poreklo/prerada nije potvrđena kao bezglutenska.").
*   **Specifični sastojci za Narandžastu listu (primeniti Opšte pravilo uz dodatne napomene):**
    *   **Caramel colors (karamel boja):** Primeni Opšte pravilo. Dodatna napomena: "Generalno bezbedne, osim ako nisu dobijene iz ječma."
    *   **Dextrin (dekstrin):**
        *   Ako je eksplicitno "dekstrin (kukuruzni)", "dekstrin (pirinčani)", "dekstrin (krompirov)": 'ocena': "sigurno".
        *   Ako je eksplicitno "pšenični dekstrin" ili "dekstrin (pšenica)" I NIJE jasno navedeno da je bezglutenski: 'ocena': "nije bezbedno", 'napomena': "Pšenični dekstrin se smatra izvorom glutena osim ako nije eksplicitno deklarisan kao bezglutenski."
        *   Ako je samo "dekstrin" (generički): primeni Opšte pravilo. Dodatna napomena: "Bezbedan ako nije od pšeničnog porekla."
    *   **Maltodextrin (maltodekstrin):**
        *   Ako je eksplicitno "maltodekstrin (pšenični)": 'ocena': "sigurno", 'napomena': "Prema EU regulativi, maltodekstrin na bazi pšenice je bezbedan."
        *   Ako je samo "maltodekstrin" (generički): primeni Opšte pravilo. Dodatna napomena: "Bezbedan ako nije na bazi pšenice." (EU regulativa dozvoljava, ali provera porekla je i dalje dobra praksa ako nema GF oznake na proizvodu).
    *   **Natural flavors (prirodne arome):** Primeni Opšte pravilo. Dodatna napomena: "Bezbedne, osim ako ne potiču iz ječma (npr. malt flavor)."
    *   **Yeast extract (ekstrakt kvasca):** Primeni Opšte pravilo. Dodatna napomena: "Potencijalno rizičan ako je dobijen iz ječma."
    *   **Glukozni sirup (glucose syrup):**
        *   Ako je eksplicitno "glukozni sirup (pšenični)" ili "glukozni sirup (ječmeni)": 'ocena': "sigurno", 'napomena': "Prema EU regulativi, glukozni sirup na bazi pšenice ili ječma je bezbedan."
        *   Ako je samo "glukozni sirup" (generički): primeni Opšte pravilo. Dodatna napomena: "Može biti problematičan ako je poreklo pšenica ili ječam, a nije izuzetak po EU regulativi ili eksplicitno GF."
    *   **Modifikovani skrob (modified starch) (ako nije eksplicitno GF ili sa Zelene liste, ili specifičan E-broj sa posebnim pravilima):** Primeni Opšte pravilo. Dodatna napomena: "Poreklo nije navedeno. Može biti od pšenice ili drugih glutenskih žitarica."
    *   **Vanilin:** 'ocena': "sigurno", 'napomena': "Sintetički vanilin ili čist ekstrakt vanile je bezbedan." (Prethodno je bio na narandžastoj listi, sada je prebačen na zelenu kao generalno bezbedan.)
    *   **Vanilla flavor (aroma vanile):** (Razlikovati od čistog vanilina) Primeni Opšte pravilo. Dodatna napomena: "Proveriti da li osnova sadrži gluten."
    *   **Generički termini kao "zgušnjivač", "stabilizator", "emulgator" (ako nisu specifični E-brojevi sa Zelene liste ili drugim pravilima):** Primeni Opšte pravilo. Dodatna napomena: "Potrebno proveriti poreklo [termina]."

**✅ ZELENA LISTA (Generalno bezbedni sastojci):**
'Ocena' je "sigurno".
*   Prirodno bezglutenske žitarice: pirinač (rice), kukuruz (corn), kinoa (quinoa), proso (millet), sirak (sorghum), heljda (buckwheat), amarant (amaranth), krompir (potato), tapioka (tapioca), aru prah (arrowroot), tef (teff), juka (yucca).
*   Ostala prirodno bezglutenska hrana: meso, riba, jaja, mlečni proizvodi (osim sladnog mleka), povrće, voće, mahunarke, orašasti plodovi (nuts).
*   **Bezglutenski pšenični skrob (wheat starch labeled gluten-free):** 'ocena': "sigurno", 'napomena': "Deklarisano kao bezglutensko i zadovoljava EU regulativu."
*   **Destilovano sirće (distilled vinegar):** 'ocena': "sigurno", 'napomena': "Destilacija uklanja gluten."
*   **Maltoza (maltose):** 'ocena': "sigurno", 'napomena': "Prirodni šećer, ne sadrži gluten."
*   **Vanilin:** 'ocena': "sigurno", 'napomena': "Sintetički vanilin ili čist ekstrakt vanile je bezbedan."
*   Zgušnjivač E415 (ksantan guma). Sojin lecitin.

**🔍 RIZIČNE FRAZE (Ukazuju na moguću kontaminaciju):**
Ako je prisutna neka od sledećih fraza (ili sličnih), dodaj je kao poseban 'sastojak' u 'rezultat' niz:
*   “može sadržati pšenicu/gluten” / “may contain wheat/gluten”
*   “može sadržati tragove pšenice/glutena” / “may contain traces of wheat/gluten”
*   “proizvedeno na opremi koja se koristi i za proizvode sa pšenicom” / “made on shared equipment with wheat”
*   “proizvedeno u pogonu gde se prerađuje pšenica” / “produced in a facility that processes wheat”
    *   'ocena' za ove fraze: "rizično – proveriti poreklo".
    *   'napomena': "Ukazuje na moguću unakrsnu kontaminaciju."
    *   Ove fraze utiču na 'ukupnaProcenaBezbednosti', čineći je "rizično" osim ako 'labelingInfo' nije 'aoecs' (u tom slučaju AOECS sertifikat može pokrivati ovaj rizik).

**🌿 OVAS (ZOB / OATS):**
*   Ako deklaracija sadrži "ovas" ili "zob" (ili "oats") I ('labelingInfo' je 'none' ili 'unknown' ILI nije eksplicitno navedeno "bezglutenska zob" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Necertifikovana/neoznačena zob/ovas", 'ocena': "nije bezbedno", 'napomena': "Visok rizik od unakrsne kontaminacije. Nije bezbedno za celijakičare osim ako nije sertifikovano kao bezglutensko."}
*   Ako deklaracija sadrži "ovas" ili "zob" (ili "oats") I ('labelingInfo' je 'aoecs' ili 'gf_text' ILI je eksplicitno navedeno "bezglutenska zob" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Sertifikovana/označena bezglutenska zob/ovas", 'ocena': "sigurno", 'napomena': "Smatra se bezbednim. Ipak, mala grupa celijakičara može biti osetljiva na avenin. Konsultovati lekara ako postoje nedoumice."}

**Određivanje 'ukupnaProcenaBezbednosti' i 'poverenjeUkupneProcene':**
1.  Ako bilo koji 'sastojak' u 'rezultat' nizu ima 'ocena: "nije bezbedno"' -> 'ukupnaProcenaBezbednosti: "nije bezbedno"'. 'poverenjeUkupneProcene': 0.9-1.0.
2.  Inače, ako postoji "Necertifikovana/neoznačena zob/ovas" sa 'ocena: "nije bezbedno"' -> 'ukupnaProcenaBezbednosti: "nije bezbedno"'. 'poverenjeUkupneProcene': 0.95.
3.  Inače, ako postoji RIZIČNA FRAZA sa 'ocena: "rizično – proveriti poreklo"' I 'labelingInfo' NIJE 'aoecs' -> 'ukupnaProcenaBezbednosti: "rizično"'. 'poverenjeUkupneProcene': 0.9.
4.  Inače, ako bilo koji 'sastojak' ima 'ocena: "rizično – proveriti poreklo"' -> 'ukupnaProcenaBezbednosti: "rizično"'. 'poverenjeUkupneProcene': 0.6-0.8 (više ako ima više takvih sastojaka).
5.  Inače, ako je prisutna "Sertifikovana/označena bezglutenska zob/ovas" (i sve ostalo je "sigurno") -> 'ukupnaProcenaBezbednosti: "potrebna pažnja"'. 'poverenjeUkupneProcene': 0.85.
6.  Inače (svi sastojci su "sigurno", nema rizičnih fraza koje nisu pokrivene AOECS-om):
    *   Ako je 'labelingInfo' 'aoecs' ili 'gf_text' -> 'ukupnaProcenaBezbednosti: "sigurno"'. 'poverenjeUkupneProcene': 0.9-1.0.
    *   Ako je 'labelingInfo' 'none' ili 'unknown' -> 'ukupnaProcenaBezbednosti: "sigurno"'. 'poverenjeUkupneProcene': 0.7-0.8 (zbog opšteg nedeklarisanog rizika).
7.  Ako je RIZIČNA FRAZA prisutna ALI 'labelingInfo' JE 'aoecs', i nema drugih problema, 'ukupnaProcenaBezbednosti' može biti "sigurno" ili "potrebna pažnja" uz napomenu da AOECS standardi mogu dozvoljavati takve izjave. 'poverenjeUkupneProcene': 0.8-0.9.

**'finalnoObrazlozenje':**
*   Mora sumirati zašto je proizvod dobio određenu 'ukupnaProcenaBezbednosti', na osnovu 'poverenjeUkupneProcene' i analize sastojaka.
*   Mora eksplicitno navesti uticaj 'labelingInfo'.
*   Ako je ovas/zob prisutan, uključi relevantnu napomenu (o riziku kontaminacije ili osetljivosti na avenin).
*   Ako su prisutni mlečni alergeni (npr. mleko, laktoza, surutka, kazein, kajmak, maslac, sir), dodaj napomenu na kraju, npr.: "Napomena o mleku: Sadrži mleko u prahu." Ovo ne utiče na procenu glutena.

Generiši 'finalnoObrazlozenje' prema sledećim smernicama, zavisno od 'ukupnaProcenaBezbednosti', 'poverenjeUkupneProcene' i 'labelingInfo':

    *   **Ako je 'ukupnaProcenaBezbednosti' "sigurno":**
        Obrazloženje počinje sa: "Proizvod ne sadrži sastojke koji sadrže gluten niti sumnjive dodatke na osnovu analize."
        Zatim dodaj rečenicu o GF oznaci: Ako je 'labelingInfo' 'aoecs', dodaj "Proizvod ima AOECS sertifikat.". Ako je 'labelingInfo' 'gf_text', dodaj "Proizvod ima gluten-free oznaku.". Ako je 'labelingInfo' 'none' ili 'unknown' ali je poverenjeUkupneProcene >= 0.9, dodaj "Iako nema eksplicitne GF oznake, analiza sastojaka ukazuje na visoku verovatnoću bezbednosti.". Ako je 'labelingInfo' 'none' ili 'unknown' i poverenjeUkupneProcene < 0.9, dodaj "Iako nema eksplicitne GF oznake (GF oznaka: {{{labelingInfo}}}), analiza sastojaka ukazuje na verovatnu bezbednost. Za potpunu sigurnost, preporučuje se provera sa proizvođačem.".
        Završi sa: "Nema identifikovanih rizičnih sastojaka na osnovu dostavljene liste."

    *   **Ako je 'ukupnaProcenaBezbednosti' "rizično" ILI "potrebna pažnja":**
        Formuliši obrazloženje na sledeći način: "Proizvod ne sadrži direktne izvore glutena, ali uključuje sastojke čije poreklo nije potvrđeno kao bezglutensko (npr. *AI, ovde navedi listu sastojaka iz 'rezultat' koji imaju ocenu 'rizično – proveriti poreklo', odvojene zarezom*). Prisutna GF oznaka je '{{{labelingInfo}}}'. Postoji *AI, ovde opiši nivo rizika (npr. umeren, umeren do nizak, nizak) na osnovu 'poverenjeUkupneProcene' i broja rizičnih sastojaka*. Tipovi rizika uključuju: *AI, ovde navedi relevantne tipove rizika koje si identifikovao, kao što su 'moguća unakrsna kontaminacija (ako postoje fraze 'može sadržati')', 'nepoznat izvor sastojaka (ako postoje sastojci sa narandžaste liste bez GF potvrde)', 'nedostatak GF deklaracije (ako je labelingInfo 'none')', 'nedostatak informacija o GF deklaraciji (ako je labelingInfo 'unknown')', 'potrebna pažnja zbog sertifikovanog ovsa (ako je relevantno)'*."
        Obavezno navedi relevantne rizične sastojke i tipove rizika.

    *   **Ako je 'ukupnaProcenaBezbednosti' "nije bezbedno":**
        Formuliši obrazloženje na sledeći način: "Proizvod sadrži sastojke koji su poznati izvori glutena (npr. *AI, ovde navedi listu sastojaka iz 'rezultat' koji imaju ocenu 'nije bezbedno', odvojene zarezom*). Nije bezglutenski i nije pogodan za osobe sa celijakijom. Prisutna GF oznaka je '{{{labelingInfo}}}'."
        Ako je 'labelingInfo' ('aoecs' ili 'gf_text') a ipak je ocenjen kao "nije bezbedno" (npr. zbog direktnog crvenog sastojka koji nije pokriven GF sertifikatom), dodaj: "Uprkos GF oznaci (GF oznaka: {{{labelingInfo}}}), prisustvo *AI, ovde navedi listu sastojaka iz 'rezultat' koji imaju ocenu 'nije bezbedno', odvojene zarezom* čini proizvod nebezbednim."

Obavezno prilagodi ove obrasce konkretnim nalazima iz 'rezultat' niza i vrednosti 'labelingInfo'. Ako nema rizičnih ili nebezbednih sastojaka za nabrajanje u specifičnoj kategoriji, izostavi taj deo rečenice ili ga prikladno prilagodi.

**Primeri za AI:**
*   Ulaz: declarationText: "bezglutenski pšenični skrob, šećer, so", labelingInfo: "gf_text"
    Očekivani deo 'rezultat': [{"sastojak": "bezglutenski pšenični skrob", "ocena": "sigurno", "napomena": "Deklarisano kao bezglutensko i zadovoljava EU regulativu."}]
    Očekivana 'ukupnaProcenaBezbednosti': "sigurno"
    Očekivano 'finalnoObrazlozenje': "Proizvod ne sadrži sastojke koji sadrže gluten niti sumnjive dodatke na osnovu analize. Proizvod ima gluten-free oznaku. Nema identifikovanih rizičnih sastojaka na osnovu dostavljene liste."
*   Ulaz: declarationText: "ječmeni slad, šećer", labelingInfo: "none"
    Očekivani deo 'rezultat': [{"sastojak": "ječmeni slad", "ocena": "nije bezbedno", "napomena": "Ječam sadrži gluten."}]
    Očekivana 'ukupnaProcenaBezbednosti': "nije bezbedno"
    Očekivano 'finalnoObrazlozenje': "Proizvod sadrži sastojke koji su poznati izvori glutena (npr. ječmeni slad). Nije bezglutenski i nije pogodan za osobe sa celijakijom. Prisutna GF oznaka je 'none'."
*   Ulaz: declarationText: "pirinčano brašno, može sadržati tragove pšenice", labelingInfo: "none"
    Očekivani deo 'rezultat': [{"sastojak": "pirinčano brašno", "ocena": "sigurno"}, {"sastojak": "Fraza: može sadržati tragove pšenice", "ocena": "rizično – proveriti poreklo", "napomena": "Ukazuje na moguću unakrsnu kontaminaciju."}]
    Očekivana 'ukupnaProcenaBezbednosti': "rizično"
    Očekivano 'finalnoObrazlozenje': "Proizvod ne sadrži direktne izvore glutena, ali uključuje sastojke čije poreklo nije potvrđeno kao bezglutensko (npr. Fraza: može sadržati tragove pšenice). Prisutna GF oznaka je 'none'. Postoji visok rizik. Tipovi rizika uključuju: moguća unakrsna kontaminacija, nedostatak GF deklaracije."


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

export { analyzeDeclaration, type AnalyzeDeclarationInput, type AnalyzeDeclarationOutput };
    
