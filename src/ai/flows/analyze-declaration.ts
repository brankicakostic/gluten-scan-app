// This file uses server-side code.
'use server';

/**
 * @fileOverview Analyzes a product declaration (ingredient list) for potential gluten ingredients,
 * providing a per-ingredient assessment and an overall product safety evaluation.
 *
 * - analyzeDeclaration - A function that analyzes the declaration text.
 * - AnalyzeDeclarationInput - The input type for the analyzeDeclaration function.
 * - AnalyzeDeclarationOutput - The return type for the analyzeDeclaration function.
 * - IngredientAssessment - The type for an individual ingredient's assessment.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

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
  nivoRizika: z.enum(["visok", "umeren", "nizak"])
    .describe("Nivo rizika sastojka: 'visok', 'umeren', ili 'nizak'."),
  kategorijaRizika: z.string().optional()
    .describe("Kategorija rizika, npr. 'gluten' (za direktne izvore), 'unakrsna kontaminacija', 'nepoznato poreklo', 'aditiv'. Ostaviti prazno ako je 'nizak' nivo rizika."),
  napomena: z.string().optional().describe("Objašnjenje za ocenu sastojka na srpskom (npr., zašto je rizičan, ili ako je uslovno siguran pod kojim uslovima).")
});
export type IngredientAssessment = z.infer<typeof IngredientAssessmentSchema>;

const AnalyzeDeclarationOutputSchema = z.object({
  rezultat: z.array(IngredientAssessmentSchema)
    .describe("Lista pojedinačno analiziranih sastojaka sa njihovim ocenama, nivoima rizika, kategorijama rizika i napomenama (sve na srpskom)."),
  ukupnaProcenaBezbednosti: z.enum(["sigurno", "rizično", "nije bezbedno", "potrebna pažnja"])
    .describe("Ukupna procena bezbednosti celog proizvoda na osnovu analize svih sastojaka: 'sigurno', 'rizično', 'nije bezbedno', 'potrebna pažnja' (safe, risky, not safe, caution needed)."),
  finalnoObrazlozenje: z.string()
    .describe("Kratko sumarno obrazloženje za ukupnu procenu bezbednosti na srpskom, uključujući važne napomene (npr. o ovsu, mlečnim alergenima, ili uticaju GF oznaka)."),
  poverenjeUkupneProcene: z.number().min(0).max(1).describe("Poverenje u ukupnu ocenu (0-1).")
});
export type AnalyzeDeclarationOutput = z.infer<typeof AnalyzeDeclarationOutputSchema>;


export async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
  const promptInput = {
    declarationText: input.declarationText,
    labelingInfo: input.labelingInfo || 'unknown',
  };
  const {output} = await analyzeDeclarationPrompt(promptInput);

  if (output && typeof output.poverenjeUkupneProcene === 'number') {
    output.poverenjeUkupneProcene = Math.max(0, Math.min(1, parseFloat(output.poverenjeUkupneProcene as any)));
  } else if (output) {
    output.poverenjeUkupneProcene = 0.5; // Default ako nedostaje ili nije broj
  }
  
  // Ensure all rezultat items have nivoRizika and kategorijaRizika, and correct types
  if (output && output.rezultat) {
    output.rezultat.forEach(item => {
      // Ensure 'ocena' is one of the allowed enum values, default if not.
      const validOcena: IngredientAssessment['ocena'][] = ["sigurno", "rizično – proveriti poreklo", "nije bezbedno"];
      if (!validOcena.includes(item.ocena)) {
        // Fallback or error handling for invalid 'ocena'
        // For now, let's assume AI provides valid 'ocena' based on prompt, or set a default
        // item.ocena = "rizično – proveriti poreklo"; // Example fallback
      }

      if (!item.nivoRizika) {
        if (item.ocena === "nije bezbedno") item.nivoRizika = "visok";
        else if (item.ocena === "rizično – proveriti poreklo") item.nivoRizika = "umeren";
        else item.nivoRizika = "nizak";
      }
      if (item.nivoRizika !== "nizak" && !item.kategorijaRizika) {
          if (item.sastojak.toLowerCase().includes("gluten") || item.sastojak.toLowerCase().includes("pšeni") || item.sastojak.toLowerCase().includes("ječm") || item.sastojak.toLowerCase().includes("raž")) {
              item.kategorijaRizika = "gluten";
          } else if (item.sastojak.toLowerCase().includes("može sadržati") || item.sastojak.toLowerCase().includes("tragove")) {
              item.kategorijaRizika = "unakrsna kontaminacija";
          } else {
              item.kategorijaRizika = "nepoznato poreklo";
          }
      }
    });
  }
  return output!;
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
    *   'nivoRizika': (enum: "visok", "umeren", "nizak") Nivo rizika tog sastojka.
    *   'kategorijaRizika': (string, opciono) Kategorija rizika, npr. 'gluten', 'unakrsna kontaminacija', 'nepoznato poreklo', 'aditiv'. Ostaviti prazno ako je 'nizak' nivo rizika.
    *   'napomena': (string, opciono) Objašnjenje za 'ocena' na srpskom (npr. zašto je rizičan, ili ako je uslovno siguran pod kojim uslovima).
2.  'ukupnaProcenaBezbednosti': (enum: "sigurno", "rizično", "nije bezbedno", "potrebna pažnja") Ukupna procena bezbednosti celog proizvoda.
3.  'finalnoObrazlozenje': (string) Kratko sumarno obrazloženje za 'ukupnaProcenaBezbednosti' na srpskom, koje mora uključiti napomene o ovsu (ako je prisutan), mlečnim alergenima (ako su prisutni), i kako je 'labelingInfo' uticao na odluku. Obavezno navedi ključne sastojke koji su doveli do te ukupne procene.
4.  'poverenjeUkupneProcene': (broj, 0-1) Tvoje poverenje u 'ukupnaProcenaBezbednosti'.

Koristi sledeća pravila za analizu svakog sastojka i određivanje 'ocena', 'nivoRizika' i 'kategorijaRizika':

**🔴 CRVENA LISTA (Zabranjeni sastojci):**
Ako je sastojak na ovoj listi, njegova 'ocena' je "nije bezbedno", 'nivoRizika' je "visok", a 'kategorijaRizika' je "gluten".
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
    *   Ako je 'labelingInfo' 'aoecs' ili 'gf_text', ILI ako je sastojak eksplicitno deklarisan kao bezglutenski (npr. "dekstrin (kukuruzni)"): 'ocena' je "sigurno", 'nivoRizika' je "nizak", 'kategorijaRizika' se može izostaviti ili postaviti na "aditiv (bezbedan zbog GF potvrde)". Napomena treba da objasni zašto (npr. "Smatra se bezbednim zbog GF oznake/sertifikata.").
    *   Ako 'labelingInfo' NIJE 'aoecs' ili 'gf_text' (tj. 'none' ili 'unknown') I sastojak NIJE eksplicitno deklarisan kao bezglutenski: 'ocena' je "rizično – proveriti poreklo", 'nivoRizika' je "umeren", 'kategorijaRizika' je "nepoznato poreklo" ili "aditiv (nepotvrđeno GF)". Napomena treba da ukaže na potencijalni rizik (npr. "Poreklo/prerada nije potvrđena kao bezglutenska.").
*   **Specifični sastojci za Narandžastu listu (primeniti Opšte pravilo uz dodatne napomene):**
    *   **Caramel colors (karamel boja E150a, E150b, E150c, E150d):** Primeni Opšte pravilo. Dodatna napomena ako je rizično: "Generalno bezbedne, osim ako nisu dobijene iz ječma." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Dextrin (dekstrin):**
        *   Ako je eksplicitno "dekstrin (kukuruzni)", "dekstrin (pirinčani)", "dekstrin (krompirov)": 'ocena': "sigurno", 'nivoRizika': "nizak".
        *   Ako je eksplicitno "pšenični dekstrin" ili "dekstrin (pšenica)" I NIJE jasno navedeno da je bezglutenski: 'ocena': "nije bezbedno", 'nivoRizika': "visok", 'kategorijaRizika': "gluten", 'napomena': "Pšenični dekstrin se smatra izvorom glutena osim ako nije eksplicitno deklarisan kao bezglutenski."
        *   Ako je samo "dekstrin" (generički): primeni Opšte pravilo. Dodatna napomena ako je rizično: "Bezbedan ako nije od pšeničnog porekla." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Maltodextrin (maltodekstrin):**
        *   Ako je eksplicitno "maltodekstrin (pšenični)": 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Prema EU regulativi, maltodekstrin na bazi pšenice je bezbedan."
        *   Ako je samo "maltodekstrin" (generički): primeni Opšte pravilo. Dodatna napomena ako je rizično: "Bezbedan ako nije na bazi pšenice, ali poreklo mora biti potvrđeno." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Natural flavors (prirodne arome):** Primeni Opšte pravilo. Dodatna napomena ako je rizično: "Bezbedne, osim ako ne potiču iz ječma (npr. malt flavor)." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Yeast extract (ekstrakt kvasca):** Primeni Opšte pravilo. Dodatna napomena ako je rizično: "Potencijalno rizičan ako je dobijen iz ječma." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Glukozni sirup (glucose syrup):**
        *   Ako je eksplicitno "glukozni sirup (pšenični)" ili "glukozni sirup (ječmeni)": 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Prema EU regulativi, glukozni sirup na bazi pšenice ili ječma je bezbedan."
        *   Ako je samo "glukozni sirup" (generički): primeni Opšte pravilo. Dodatna napomena ako je rizično: "Može biti problematičan ako je poreklo pšenica ili ječam, a nije izuzetak po EU regulativi ili eksplicitno GF." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Modifikovani skrob (modified starch) (ako nije eksplicitno GF ili sa Zelene liste, ili specifičan E-broj sa posebnim pravilima):** Primeni Opšte pravilo. Dodatna napomena ako je rizično: "Poreklo nije navedeno. Može biti od pšenice ili drugih glutenskih žitarica." Kategorija rizika ako je umeren: "nepoznato poreklo". Obuhvata E-brojeve kao E1404, E1410, E1412, E1413, E1414, E1420, E1422, E1440, E1442 ako nije specificirano drugačije.
    *   **Vanilin:** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Sintetički vanilin ili čist ekstrakt vanile je bezbedan."
    *   **Vanilla flavor (aroma vanile):** (Razlikovati od čistog vanilina) Primeni Opšte pravilo. Dodatna napomena ako je rizično: "Proveriti da li osnova sadrži gluten." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".
    *   **Generički termini kao "zgušnjivač", "stabilizator", "emulgator" (ako nisu specifični E-brojevi sa Zelene liste ili drugim pravilima):** Primeni Opšte pravilo. Dodatna napomena: "Potrebno proveriti poreklo [termina]." Kategorija rizika ako je umeren: "nepoznato poreklo".
    *   **E575 (glukonodelta lakton):** Primeni Opšte pravilo. Dodatna napomena ako je rizično: "Može biti od pšenice, iako se generalno smatra bezbednim." Kategorija rizika ako je umeren: "aditiv (nepotvrđeno GF)".

**✅ ZELENA LISTA (Generalno bezbedni sastojci):**
'Ocena' je "sigurno", 'nivoRizika' je "nizak". 'KategorijaRizika' se može izostaviti.
*   Prirodno bezglutenske žitarice: pirinač (rice), kukuruz (corn), kinoa (quinoa), proso (millet), sirak (sorghum), heljda (buckwheat), amarant (amaranth), krompir (potato), tapioka (tapioca), aru prah (arrowroot), tef (teff), juka (yucca).
*   Ostala prirodno bezglutenska hrana: meso, riba, jaja, mlečni proizvodi (osim sladnog mleka), povrće, voće, mahunarke, orašasti plodovi (nuts).
*   **Bezglutenski pšenični skrob (wheat starch labeled gluten-free):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Deklarisano kao bezglutensko i zadovoljava EU regulativu."
*   **Destilovano sirće (distilled vinegar):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Destilacija uklanja gluten."
*   **Maltoza (maltose):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Prirodni šećer, ne sadrži gluten."
*   Zgušnjivač E415 (ksantan guma). Sojin lecitin.

**🔍 RIZIČNE FRAZE (Ukazuju na moguću kontaminaciju):**
Ako je prisutna neka od sledećih fraza (ili sličnih), dodaj je kao poseban 'sastojak' u 'rezultat' niz:
*   “može sadržati pšenicu/gluten” / “may contain wheat/gluten”
*   “može sadržati tragove pšenice/glutena” / “may contain traces of wheat/gluten”
*   “proizvedeno na opremi koja se koristi i za proizvode sa pšenicom” / “made on shared equipment with wheat”
*   “proizvedeno u pogonu gde se prerađuje pšenica” / “produced in a facility that processes wheat”
    *   'ocena' za ove fraze: "rizično – proveriti poreklo".
    *   'nivoRizika': "umeren".
    *   'kategorijaRizika': "unakrsna kontaminacija".
    *   'napomena': "Ukazuje na moguću unakrsnu kontaminaciju."
    *   Ove fraze utiču na 'ukupnaProcenaBezbednosti', čineći je "rizično" osim ako 'labelingInfo' nije 'aoecs' (u tom slučaju AOECS sertifikat može pokrivati ovaj rizik).

**🌿 OVAS (ZOB / OATS):**
*   Ako deklaracija sadrži "ovas" ili "zob" (ili "oats") I ('labelingInfo' je 'none' ili 'unknown' ILI nije eksplicitno navedeno "bezglutenska zob" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Necertifikovana/neoznačena zob/ovas", 'ocena': "nije bezbedno", 'nivoRizika': "visok", 'kategorijaRizika': "unakrsna kontaminacija", 'napomena': "Visok rizik od unakrsne kontaminacije. Nije bezbedno za celijakičare osim ako nije sertifikovano kao bezglutensko."}
*   Ako deklaracija sadrži "ovas" ili "zob" (ili "oats") I ('labelingInfo' je 'aoecs' ili 'gf_text' ILI je eksplicitno navedeno "bezglutenska zob" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Sertifikovana/označena bezglutenska zob/ovas", 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Smatra se bezbednim. Ipak, mala grupa celijakičara može biti osetljiva na avenin. Konsultovati lekara ako postoje nedoumice."}

**Određivanje 'ukupnaProcenaBezbednosti' i 'poverenjeUkupneProcene':**
*   Ako bilo koji sastojak ima 'ocena': "nije bezbedno", onda je 'ukupnaProcenaBezbednosti': "nije bezbedno". 'PoverenjeUkupneProcene' treba da bude visoko (npr. 0.9-1.0).
*   Inače, ako bilo koji sastojak ima 'ocena': "rizično – proveriti poreklo" ILI ako je prisutna rizična fraza o kontaminaciji (osim ako 'labelingInfo' nije 'aoecs'), onda je 'ukupnaProcenaBezbednosti': "rizično". 'PoverenjeUkupneProcene' zavisi od broja i vrste rizičnih stavki (npr. 0.6-0.85). Ako je 'labelingInfo' 'aoecs' i prisutne su samo fraze o kontaminaciji, proizvod može biti "potrebna pažnja" umesto "rizično".
*   Inače, ako su svi sastojci "sigurno" (ili pokriveni 'aoecs'/'gf_text'), ali 'labelingInfo' je 'none' ili 'unknown', a postoje sastojci sa narandžaste liste koji su zbog toga dobili ocenu "sigurno" (ali bi bez GF oznake bili rizični), 'ukupnaProcenaBezbednosti' može biti "potrebna pažnja". 'PoverenjeUkupneProcene' (npr. 0.7-0.8).
*   Inače (svi sastojci sigurni, i/ili 'labelingInfo' je 'aoecs' ili 'gf_text' i nema nerešenih rizika), 'ukupnaProcenaBezbednosti': "sigurno". 'PoverenjeUkupneProcene' (npr. 0.85-1.0).

**'finalnoObrazlozenje':**
Generiši kratko sumarno obrazloženje na srpskom na osnovu 'ukupnaProcenaBezbednosti' i ključnih nalaza iz 'rezultat' niza.
Obrazloženje (uzmi u obzir i 'labelingInfo' i 'poverenjeUkupneProcene' i 'rezultat'):
- Ako je 'ukupnaProcenaBezbednosti' "sigurno":
  "Proizvod ne sadrži sastojke koji sadrže gluten niti sumnjive dodatke. (AI: Ovde dodaj rečenicu o GF oznaci na osnovu 'labelingInfo' i 'poverenjeUkupneProcene'. Primeri: Ako je 'labelingInfo' 'aoecs', dodaj 'Proizvod ima AOECS sertifikat.'. Ako je 'labelingInfo' 'gf_text', dodaj 'Proizvod ima gluten-free oznaku.'. Ako je 'labelingInfo' 'none' ili 'unknown' ali je poverenjeUkupneProcene >= 0.9, dodaj 'Iako nema eksplicitne GF oznake, analiza sastojaka ukazuje na visoku verovatnoću bezbednosti.'). Nema identifikovanih rizičnih sastojaka."
  (Ako 'rezultat' sadrži "Sertifikovana/označena bezglutenska zob/ovas", dodaj: "Sadrži sertifikovanu bezglutensku zob, koja je generalno bezbedna, ali osobe sa posebnom osetljivošću na avenin treba da budu oprezne.")
- Ako je 'ukupnaProcenaBezbednosti' "potrebna pažnja":
  "Proizvod je označen kao 'potrebna pažnja'. (AI: Ovde objasni zašto, npr. zbog prisustva sastojaka sa narandžaste liste bez GF potvrde, ili zbog 'labelingInfo' koji sugeriše oprez iako nema direktnih izvora glutena. Navedi ključne sastojke iz 'rezultat' koji su doprineli ovoj oceni, npr. 'Sadrži sastojke kao što su [sastojak1], [sastojak2] koji zahtevaju proveru porekla.'). Informacija o GF oznaci: {{labelingInfo}}."
- Ako je 'ukupnaProcenaBezbednosti' "rizično":
  "Proizvod je označen kao 'rizično'. (AI: Ovde objasni zašto, npr. zbog prisustva fraza o unakrsnoj kontaminaciji ili većeg broja rizičnih sastojaka bez GF potvrde. Navedi ključne sastojke ili fraze iz 'rezultat' koji su doprineli ovoj oceni, npr. 'Upozorenje o mogućim tragovima ([fraza]) je prisutno.' ili 'Sadrži rizične sastojke kao što su [sastojak1].'). Informacija o GF oznaci: {{labelingInfo}}."
  (Ako 'rezultat' sadrži "Necertifikovana/neoznačena zob/ovas", dodaj: "Prisutna je necertifikovana zob, što predstavlja visok rizik.")
- Ako je 'ukupnaProcenaBezbednosti' "nije bezbedno":
  "Proizvod SADRŽI GLUTEN ili sastojke visokog rizika i NIJE BEZBEDAN. (AI: Navedi ključne sastojke iz 'rezultat' sa ocenom 'nije bezbedno' koji su doveli do ove procene, npr. 'Identifikovani su sledeći izvori glutena: [sastojak1], [sastojak2].'). Informacija o GF oznaci: {{labelingInfo}}."

Obavezno prilagodi ove obrasce konkretnim nalazima iz 'rezultat' niza i vrednosti 'labelingInfo'. Ako nema rizičnih ili nebezbednih sastojaka za nabrajanje u specifičnoj kategoriji, izostavi taj deo rečenice ili ga prikladno prilagodi.

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
      output.poverenjeUkupneProcene = Math.max(0, Math.min(1, parseFloat(output.poverenjeUkupneProcene as any)));
    } else if (output) {
      output.poverenjeUkupneProcene = 0.5;
    }
    
    if (output && output.rezultat) {
      output.rezultat.forEach(item => {
        if (!item.nivoRizika) {
          if (item.ocena === "nije bezbedno") item.nivoRizika = "visok";
          else if (item.ocena === "rizično – proveriti poreklo") item.nivoRizika = "umeren";
          else item.nivoRizika = "nizak";
        }
        if (item.nivoRizika !== "nizak" && !item.kategorijaRizika) {
            if (item.sastojak.toLowerCase().includes("gluten") || item.sastojak.toLowerCase().includes("pšeni") || item.sastojak.toLowerCase().includes("ječm") || item.sastojak.toLowerCase().includes("raž")) {
                item.kategorijaRizika = "gluten";
            } else if (item.sastojak.toLowerCase().includes("može sadržati") || item.sastojak.toLowerCase().includes("tragove")) {
                item.kategorijaRizika = "unakrsna kontaminacija";
            } else {
                item.kategorijaRizika = "nepoznato poreklo";
            }
        }
      });
    }
    return output!;
  }
);
