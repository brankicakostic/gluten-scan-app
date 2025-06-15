
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
import {type ZodTypeAny, z}from 'genkit';

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
    .describe("Ocena bezbednosti sastojka SA ASPEKTA GLUTENA: 'sigurno' (safe), 'rizično – proveriti poreklo' (risky - check origin for gluten), ili 'nije bezbedno' (not safe due to gluten)."),
  nivoRizika: z.enum(["visok", "umeren", "nizak"])
    .describe("Nivo rizika sastojka SA ASPEKTA GLUTENA: 'visok', 'umeren', ili 'nizak'."),
  kategorijaRizika: z.string().optional()
    .describe("Kategorija rizika SA ASPEKTA GLUTENA, npr. 'gluten' (za direktne izvore), 'unakrsna kontaminacija glutenom', 'nepoznato poreklo (rizik od glutena)', 'aditiv (rizik od glutena)'. Ostaviti prazno ako je 'nizak' nivo rizika za gluten."),
  napomena: z.string().optional().describe("Objašnjenje za ocenu sastojka na srpskom (npr., zašto je rizičan ZBOG GLUTENA, ili ako je uslovno siguran pod kojim uslovima). Ako sastojak nije rizičan zbog glutena, ali je čest alergen (npr. soja, kikiriki), to se može napomenuti ovde, ali ocena i nivo rizika treba da ostanu vezani za gluten.")
});
export type IngredientAssessment = z.infer<typeof IngredientAssessmentSchema>;

const AnalyzeDeclarationOutputSchema = z.object({
  rezultat: z.array(IngredientAssessmentSchema)
    .describe("Lista pojedinačno analiziranih sastojaka sa njihovim ocenama, nivoima rizika, kategorijama rizika i napomenama (sve na srpskom, sa fokusom na gluten)."),
  ukupnaProcenaBezbednosti: z.enum(["sigurno", "rizično", "nije bezbedno", "potrebna pažnja"])
    .describe("Ukupna procena bezbednosti celog proizvoda SA ASPEKTA GLUTENA na osnovu analize svih sastojaka: 'sigurno', 'rizično', 'nije bezbedno', 'potrebna pažnja' (safe, risky, not safe, caution needed regarding gluten)."),
  finalnoObrazlozenje: z.string()
    .describe("Kratko sumarno obrazloženje za ukupnu procenu bezbednosti na srpskom, uključujući važne napomene (npr. o ovsu, ili uticaju GF oznaka). Ovde treba pomenuti i druge česte alergene ako su prisutni (npr. soja, kikiriki, mleko, jaja), ali jasno naznačiti da oni ne utiču na procenu glutenskog statusa, osim ako ne postoji rizik od unakrsne kontaminacije glutenom."),
  poverenjeUkupneProcene: z.number().min(0).max(1).describe("Poverenje u ukupnu ocenu (0-1) vezano za gluten.")
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
          const lowerSastojak = item.sastojak.toLowerCase();
          if (lowerSastojak.includes("gluten") || lowerSastojak.includes("pšeni") || lowerSastojak.includes("ječm") || lowerSastojak.includes("raž")) {
              item.kategorijaRizika = "gluten";
          } else if (lowerSastojak.includes("može sadržati") || lowerSastojak.includes("tragove")) {
               if (lowerSastojak.includes("pšenice") || lowerSastojak.includes("glutena") || lowerSastojak.includes("ječma") || lowerSastojak.includes("raži")) {
                item.kategorijaRizika = "unakrsna kontaminacija glutenom";
               } else {
                item.kategorijaRizika = "unakrsna kontaminacija";
               }
          } else if (item.ocena === "rizično – proveriti poreklo"){
               item.kategorijaRizika = "nepoznato poreklo (rizik od glutena)";
          } else {
             // Pokušaj da se kategoriše na osnovu E-broja ili generičkog termina ako je moguće
             if (/^E\d+/.test(lowerSastojak) || ["skrob", "maltodekstrin", "dekstroza", "aroma", "emulgator", "zgušnjivač", "stabilizator"].some(term => lowerSastojak.includes(term))) {
                item.kategorijaRizika = "aditiv (rizik od glutena)";
             } else {
                item.kategorijaRizika = "nepoznato (rizik od glutena)";
             }
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

TVOJ PRIMARNI FOKUS JE DETEKCIJA GLUTENA. Ako u deklaraciji primetiš upozorenja o drugim čestim alergenima (npr. soja, kikiriki, orašasti plodovi, mleko, jaja) koji NISU direktno povezani sa GLUTENOM, spomeni ih u 'finalnoObrazlozenje' kao DODATNU informaciju za korisnike koji mogu imati i druge alergije. Međutim, ova upozorenja NE BI TREBALO da utiču na 'ukupnaProcenaBezbednosti' VEZANU ZA GLUTEN, niti na 'ocena' i 'nivoRizika' pojedinačnih sastojaka ako ti sastojci sami po sebi nisu rizični zbog glutena (npr. "sojin lecitin" je "sigurno" sa aspekta glutena). Izuzetak je ako fraza o tragovima eksplicitno navodi rizik od unakrsne kontaminacije GLUTENOM (npr. "može sadržati tragove pšenice I soje" - tada je relevantno za gluten).

Na osnovu analize, treba da generišeš JSON objekat sa sledećom strukturom:
1.  'rezultat': Niz objekata. Svaki objekat predstavlja jedan analizirani sastojak ili frazu iz deklaracije i treba da sadrži:
    *   'sastojak': (string) Naziv analiziranog sastojka ili fraze (na srpskom).
    *   'ocena': (enum: "sigurno", "rizično – proveriti poreklo", "nije bezbedno") Procena bezbednosti tog sastojka SA ASPEKTA GLUTENA.
    *   'nivoRizika': (enum: "visok", "umeren", "nizak") Nivo rizika tog sastojka SA ASPEKTA GLUTENA.
    *   'kategorijaRizika': (string, opciono) Kategorija rizika SA ASPEKTA GLUTENA, npr. 'gluten' (za direktne izvore glutena), 'unakrsna kontaminacija glutenom', 'nepoznato poreklo (rizik od glutena)', 'aditiv (rizik od glutena)'. Ostaviti prazno ako je 'nizak' nivo rizika za gluten.
    *   'napomena': (string, opciono) Objašnjenje za 'ocena' na srpskom (npr. zašto je rizičan ZBOG GLUTENA). Ako sastojak nije rizičan zbog glutena, ali je čest alergen (npr. soja, kikiriki), to se može navesti ovde, ali 'ocena' i 'nivoRizika' moraju ostati fokusirani na gluten.
2.  'ukupnaProcenaBezbednosti': (enum: "sigurno", "rizično", "nije bezbedno", "potrebna pažnja") Ukupna procena bezbednosti celog proizvoda SA ASPEKTA GLUTENA.
3.  'finalnoObrazlozenje': (string) Kratko sumarno obrazloženje za 'ukupnaProcenaBezbednosti' na srpskom, koje mora uključiti napomene o ovsu (ako je prisutan), i kako je 'labelingInfo' uticao na odluku. Obavezno navedi ključne sastojke koji su doveli do te ukupne procene VEZANE ZA GLUTEN. Ako postoje upozorenja o drugim čestim alergenima (npr. soja, kikiriki, orašasti plodovi, mleko, jaja), navedi ih kao DODATNU informaciju za korisnika, ali naglasi da ta upozorenja ne utiču na samu procenu bezbednosti od glutena, osim ako ne postoji rizik od unakrsne kontaminacije GLUTENOM.
4.  'poverenjeUkupneProcene': (broj, 0-1) Tvoje poverenje u 'ukupnaProcenaBezbednosti' VEZANO ZA GLUTEN.

Koristi sledeća pravila za analizu svakog sastojka i određivanje 'ocena', 'nivoRizika' i 'kategorijaRizika' (sve sa fokusom na GLUTEN):

**🔴 CRVENA LISTA (Zabranjeni sastojci zbog glutena):**
Ako je sastojak na ovoj listi, njegova 'ocena' je "nije bezbedno", 'nivoRizika' je "visok", a 'kategorijaRizika' je "gluten".
*   pšenica (uključujući pšenično brašno, pšenične klice, durum, farina, graham, semolina, spelta, einkorn, emmer, kamut, wheat, polba/polbino brašno)
*   raž (rye)
*   ječam (barley)
*   tritikale (triticale)
*   Malt (uključujući malt extract, malt flavor, malt syrup, slad, ekstrakt slada, sladni sirup, aroma slada) - UVEK sadrži gluten, ne podleže GF oznakama za izuzimanje.
*   pivski kvasac (brewer’s yeast)
*   pšenični skrob (wheat starch) - ako NIJE eksplicitno deklarisan kao "bezglutenski pšenični skrob" ILI ako proizvod nema 'aoecs'/'gf_text' oznaku koja pokriva ovaj sastojak. Ako jeste deklarisan kao GF ili ga pokriva GF sertifikat, ide na Zelenu listu.
*   Ovas/Zob (oats) - ako NIJE eksplicitno deklarisan kao "bezglutenski ovas/zob" ili "sertifikovani bezglutenski ovas/zob" i proizvod nema 'aoecs'/'gf_text' oznaku. Vidi posebna pravila za OVAS.

**🟠 NARANDŽASTA LISTA (Sastojci koji mogu biti rizični zbog glutena, zahtevaju proveru):**
Ovi sastojci zahtevaju proveru 'labelingInfo' ili eksplicitnu GF deklaraciju na samom sastojku.
*   **Opšte pravilo za Narandžastu listu (fokus na gluten):**
    *   Ako je sastojak eksplicitno deklarisan kao bezglutenski (npr. "dekstrin (kukuruzni)", "modifikovani skrob (kukuruzni)", "glukozni sirup (kukuruzni)", "aroma (bez glutena)") ILI ako je 'labelingInfo' 'aoecs' ili 'gf_text' (i smatra se da ta oznaka pokriva dati sastojak): 'ocena' je "sigurno", 'nivoRizika' je "nizak". Napomena treba da objasni zašto (npr. "Smatra se bezbednim zbog GF oznake/sertifikata.", ili "Poreklo (kukuruzno) je bezglutensko.").
    *   Ako 'labelingInfo' NIJE 'aoecs' ili 'gf_text' (tj. 'none' ili 'unknown') I sastojak NIJE eksplicitno deklarisan kao bezglutenski (npr. piše samo "glukozni sirup", "modifikovani skrob", "aroma"): 'ocena' je "rizično – proveriti poreklo", 'nivoRizika' je "umeren". Kategorija rizika i napomena zavise od specifičnog sastojka ispod.
*   **Specifični sastojci za Narandžastu listu (primeniti Opšte pravilo uz dodatne napomene FOKUSIRANE NA GLUTEN):**
    *   **glukozni sirup**: (ako nije eksplicitno deklarisan kao GF ili od kukuruza/pirinča/krompira) 'kategorijaRizika': "nepoznato poreklo (rizik od glutena)". 'napomena': "Poreklo nije navedeno. Ako je na bazi pšenice ili ječma, a proizvod nije GF sertifikovan, može postojati rizik od glutena."
    *   **dekstroza**: (ako nije eksplicitno deklarisana kao GF ili od kukuruza/pirinča/krompira) 'kategorijaRizika': "nepoznato poreklo (rizik od glutena)". 'napomena': "Može biti iz kukuruza ili pšenice. Ako nije jasno poreklo i nema GF oznake, preporučuje se oprez."
    *   **maltodekstrin**: (ako nije eksplicitno deklarisan kao GF ili od kukuruza/pirinča/krompira) 'kategorijaRizika': "nepoznato poreklo (rizik od glutena)". 'napomena': "Obično se pravi od kukuruza, ali može poticati i od pšenice. Ako nije deklarisan kao gluten free, postoji rizik."
    *   **skrob / modifikovani skrob**: (ako nije eksplicitno deklarisan kao GF ili od kukuruza/pirinča/krompira/tapioke, ili specifičan E-broj sa liste E1404-1451 koji nije pokriven drugačije) 'kategorijaRizika': "nepoznato poreklo (rizik od glutena)". 'napomena': "Može biti dobijen iz pšenice, kukuruza ili krompira. Ako nije označen kao bez glutena, preporučuje se provera porekla."
    *   **E1404, E1410, E1412, E1413, E1414, E1420, E1422, E1440, E1442, E1450, E1451 (modifikovani skrobovi)**: (ako nije eksplicitno deklarisan kao GF ili od kukuruza/pirinča/krompira/tapioke) 'kategorijaRizika': "aditiv (modifikovani skrob - rizik od glutena)". 'napomena': "Ovaj aditiv (modifikovani skrob) može biti bez glutena, ali poreklo treba proveriti zbog mogućnosti žitarica kao izvora."
    *   **aroma / prirodna aroma**: (ako nije eksplicitno deklarisana kao GF) 'kategorijaRizika': "aditiv (aroma - nepotvrđeno GF)". 'napomena': "Arome mogu sadržati gluten kao nosač ukusa. Ako nije naznačeno da su bez glutena, potrebno je dodatno proveriti."
    *   **E471 (Mono- i digliceridi masnih kiselina)**: 'kategorijaRizika': "aditiv (E471 - nepotvrđeno GF poreklo)". 'napomena': "E471 može biti biljnog ili životinjskog porekla, ali ako je iz pšenice, može sadržati gluten. Preporučuje se dodatna provera."
    *   **E322 (lecitin)**: 'kategorijaRizika': "aditiv (lecitin - nepotvrđeno poreklo)". 'napomena': "Ovaj aditiv (emulgator) može biti bez glutena, ali poreklo treba proveriti zbog mogućnosti žitarica kao izvora."
    *   **E472a, E472b, E472c, E472e (estri masnih kiselina)**: 'kategorijaRizika': "aditiv (emulgator - rizik od glutena)". 'napomena': "Ovaj aditiv (emulgator) može biti bez glutena, ali poreklo treba proveriti zbog mogućnosti žitarica kao izvora."
    *   **E476 (poliglicerol poliricinoleat)**: 'kategorijaRizika': "aditiv (emulgator - nepotvrđeno poreklo)". 'napomena': "Ovaj emulgator može biti bez glutena, ali poreklo treba proveriti zbog mogućnosti žitarica kao izvora."
    *   **karamel (caramel color) / karamelizovani šećer** (uključujući E150a, E150b, E150c, E150d): 'kategorijaRizika': "aditiv (karamel - nepotvrđeno GF)". 'napomena': "Neki oblici karamel boje mogu biti napravljeni od ili sadržati nosače iz žitarica – provera poželjna ako proizvod nije GF."
    *   **E160b(ii) (Anato, biksin, norbiksin)**: 'kategorijaRizika': "aditiv (anato - rizik od glutena)". 'napomena': "Ovaj aditiv može biti bez glutena, ali poreklo treba proveriti zbog mogućnosti žitarica kao izvora ili nosača."
    *   **Yeast extract (ekstrakt kvasca)**: 'kategorijaRizika': "aditiv (ekstrakt kvasca - nepotvrđeno GF)". 'napomena': "Potencijalno rizičan sa aspekta glutena ako je dobijen iz ječma (pivski kvasac)."
    *   **Generički termini kao "zgušnjivač", "stabilizator", "emulgator"** (ako nisu specifični E-brojevi sa Zelene liste ili drugim pravilima): 'kategorijaRizika': "nepoznato poreklo (rizik od glutena)". 'napomena': "Potrebno proveriti poreklo [termina] radi rizika od glutena."
    *   **Žitni destilat (cereal distillate)**: 'kategorijaRizika': "aditiv (žitni destilat - rizik od glutena)". 'napomena': "Etanol na bazi žitarica može zadržati tragove glutena – zavisi od stepena pročišćenja. Ako se koristi u hrani, potreban oprez ako proizvod nije GF sertifikovan."

**✅ ZELENA LISTA (Generalno bezbedni sastojci sa aspekta glutena):**
'Ocena' je "sigurno", 'nivoRizika' je "nizak". 'KategorijaRizika' se može izostaviti.
*   Prirodno bezglutenske žitarice: pirinač (rice), kukuruz (corn), kinoa (quinoa), proso (millet), sirak (sorghum), heljda (buckwheat), amarant (amaranth), krompir (potato), tapioka (tapioca), aru prah (arrowroot), tef (teff), juka (yucca).
*   Ostala prirodno bezglutenska hrana: meso, riba, jaja, mlečni proizvodi (osim sladnog mleka), povrće, voće, mahunarke, orašasti plodovi (nuts) - **osim ako nisu kontaminirani glutenom u preradi, što bi se reflektovalo kroz rizične fraze.**
*   **Bezglutenski pšenični skrob (wheat starch labeled gluten-free) / Pšenični skrob ako je 'labelingInfo' 'aoecs' ili 'gf_text'**: 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Deklarisano kao bezglutensko ili pokriveno GF sertifikatom i zadovoljava EU regulativu."
*   **Maltodekstrin (maltodextrin)** (ako je eksplicitno deklarisan kao bezglutenski ILI na bazi kukuruza, pirinča, krompira, ILI ako je na bazi pšenice ali je proizvod GF sertifikovan ('aoecs'/'gf_text')):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Prema EU regulativi, maltodekstrin na bazi pšenice je bezbedan. Na bazi kukuruza je takođe bezbedan. GF oznaka potvrđuje bezbednost."
*   **Glukozni sirup (glucose syrup) / Dekstroza (dextrose)** (ako je eksplicitno deklarisan kao bezglutenski ILI na bazi kukuruza, pirinča, krompira, ILI ako je na bazi pšenice ili ječma a proizvod je GF sertifikovan ('aoecs'/'gf_text')):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Prema EU regulativi, glukozni sirup/dekstroza na bazi pšenice ili ječma su bezbedni. Na bazi kukuruza takođe. GF oznaka potvrđuje bezbednost."
*   **Destilovano sirće (distilled vinegar):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Destilacija uklanja gluten."
*   **Maltoza (maltose):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Prirodni šećer, ne sadrži gluten."
*   **Vanilin, Vanilla flavor (aroma vanile):** 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Sintetički vanilin ili čist ekstrakt/aroma vanile su bezbedni sa aspekta glutena. Uvek je dobro proveriti da nosač arome nije na bazi glutena, mada je to retko za vanilin."
*   **E575 (glukonodelta lakton)**: (ako je 'labelingInfo' 'aoecs' ili 'gf_text') 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Generalno se smatra bezbednim sa aspekta glutena kada je proizvod GF sertifikovan ili označen." Ako nema GF oznake, 'ocena': "rizično – proveriti poreklo", 'nivoRizika': "umeren", 'kategorijaRizika': "aditiv (E575 - nepotvrđeno GF)", 'napomena': "Nema dokaza o prisustvu glutena, ali se oprez savetuje kod industrijske prerade ako proizvod nije GF."
*   Zgušnjivač E415 (ksantan guma). Sojin lecitin (bezbedan sa aspekta glutena, ali napomeni ako je alergen).

**🔍 RIZIČNE FRAZE (Ukazuju na moguću KONTAMINACIJU GLUTENOM):**
Ako je prisutna neka od sledećih fraza (ili sličnih) KOJA UKLJUČUJE GLUTENSKE ŽITARICE, dodaj je kao poseban 'sastojak' u 'rezultat' niz:
*   “može sadržati pšenicu/gluten/ječam/raž” / “may contain wheat/gluten/barley/rye”
*   “može sadržati tragove pšenice/glutena/ječma/raži” / “may contain traces of wheat/gluten/barley/rye”
*   “proizvedeno na opremi koja se koristi i za proizvode sa pšenicom/glutenom/ječmom/raži”
*   “proizvedeno u pogonu gde se prerađuje pšenica/gluten/ječam/raž”
    *   'ocena' za ove fraze: "rizično – proveriti poreklo".
    *   'nivoRizika': "umeren".
    *   'kategorijaRizika': "unakrsna kontaminacija glutenom".
    *   'napomena': "Ukazuje na moguću unakrsnu kontaminaciju glutenom."
    *   Ove fraze utiču na 'ukupnaProcenaBezbednosti' vezanu za gluten, čineći je "rizično" osim ako 'labelingInfo' nije 'aoecs' (u tom slučaju AOECS sertifikat može pokrivati ovaj rizik).
*   Ako fraza glasi npr. "može sadržati tragove soje i kikirikija", to je informacija o drugim alergenima i ne utiče na procenu glutena, osim ako se u istoj frazi ne pominje i gluten/pšenica. Tretiraj takve fraze kao poseban unos sa 'ocena': "sigurno" (za gluten), 'nivoRizika': "nizak" (za gluten), ali u 'napomena' navedi da se odnosi na druge alergene.

**🌿 OVAS (ZOB / OATS):**
*   Ako deklaracija sadrži "ovas" ili "zob" (ili "oats") I ('labelingInfo' je 'none' ili 'unknown' ILI nije eksplicitno navedeno "bezglutenska zob/ovas" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Necertifikovana/neoznačena zob/ovas", 'ocena': "nije bezbedno", 'nivoRizika': "visok", 'kategorijaRizika': "unakrsna kontaminacija glutenom", 'napomena': "Visok rizik od unakrsne kontaminacije glutenom. Nije bezbedno za celijakičare osim ako nije sertifikovano kao bezglutensko."}
*   Ako deklaracija sadrži "ovas" ili "zob" (ili "oats") I ('labelingInfo' je 'aoecs' ili 'gf_text' ILI je eksplicitno navedeno "bezglutenska zob/ovas" ili "certified gluten-free oats"):
    *   Dodaj u 'rezultat': {'sastojak': "Sertifikovana/označena bezglutenska zob/ovas", 'ocena': "sigurno", 'nivoRizika': "nizak", 'napomena': "Smatra se bezbednim sa aspekta glutena. Ipak, mala grupa celijakičara može biti osetljiva na avenin. Konsultovati lekara ako postoje nedoumice."}

**Određivanje 'ukupnaProcenaBezbednosti' (SA ASPEKTA GLUTENA) i 'poverenjeUkupneProcene':**
*   Ako bilo koji sastojak ima 'ocena': "nije bezbedno" (zbog glutena), onda je 'ukupnaProcenaBezbednosti': "nije bezbedno". 'PoverenjeUkupneProcene' treba da bude visoko (npr. 0.9-1.0).
*   Inače, ako bilo koji sastojak ima 'ocena': "rizično – proveriti poreklo" (zbog glutena) ILI ako je prisutna rizična fraza o kontaminaciji GLUTENOM (osim ako 'labelingInfo' nije 'aoecs' i pokriva taj rizik), onda je 'ukupnaProcenaBezbednosti': "rizično". 'PoverenjeUkupneProcene' zavisi od broja i vrste rizičnih stavki (npr. 0.6-0.85).
*   Inače, ako 'labelingInfo' nije 'aoecs', a postoje sastojci sa Narandžaste liste koji su dobili ocenu "sigurno" samo zbog pretpostavke da ih 'gf_text' oznaka pokriva (ali bi bez nje bili rizični ZBOG GLUTENA), ILI ako je 'labelingInfo' 'none' ili 'unknown' a postoje sastojci sa Narandžaste liste, 'ukupnaProcenaBezbednosti' treba da bude "potrebna pažnja". Ovo je važno zbog napomene: "Ako proizvod nema AOECS oznaku ili drugi pouzdan sertifikat, ne označavaj ga kao 'bezbedan' samo zato što nema direktan gluten – proveri i skrivene izvore." 'PoverenjeUkupneProcene' (npr. 0.7-0.8).
*   Inače (svi sastojci sigurni sa aspekta glutena, i 'labelingInfo' je 'aoecs' i nema nerešenih rizika od glutena, ili 'labelingInfo' je 'gf_text' i svi sumnjivi sastojci su pokriveni tom oznakom), 'ukupnaProcenaBezbednosti': "sigurno". 'PoverenjeUkupneProcene' (npr. 0.85-1.0).

**'finalnoObrazlozenje' (FOKUS NA GLUTEN, uz napomene o drugim alergenima):**
Generiši kratko sumarno obrazloženje na srpskom na osnovu 'ukupnaProcenaBezbednosti' i ključnih nalaza iz 'rezultat' niza.
Prilikom sastavljanja obrazloženja, koristi sledeće smernice:

- Za status "sigurno":
  Počni sa: "Proizvod ne sadrži sastojke koji predstavljaju rizik od glutena."
  Zatim, ako je 'labelingInfo' 'aoecs', dodaj: "Proizvod ima AOECS sertifikat."
  Ako je 'labelingInfo' 'gf_text', dodaj: "Proizvod ima gluten-free oznaku."
  Ako je 'labelingInfo' 'none' ili 'unknown' ali poverenjeUkupneProcene je >= 0.85, dodaj: "Iako nema eksplicitne GF oznake, analiza sastojaka ukazuje na visoku verovatnoću bezbednosti od glutena."
  Nastavi sa: "Nema identifikovanih rizičnih sastojaka za gluten."
  Ako 'rezultat' sadrži unos za 'Sertifikovana/označena bezglutenska zob/ovas', dodaj: "Sadrži sertifikovanu bezglutensku zob, koja je generalno bezbedna za osobe sa celijakijom, ali osobe sa posebnom osetljivošću na avenin treba da budu oprezne."
  Ako postoje drugi alergeni koji NISU gluten (npr. soja, kikiriki), dodaj: "Napomena: Proizvod sadrži [navedi alergene] ili može sadržati tragove [orašastih plodova/mleka], što je važno za osobe sa tim alergijama ali ne utiče na GF status."

- Za status "potrebna pažnja":
  Počni sa: "Proizvod je označen kao 'potrebna pažnja' sa aspekta glutena."
  Objasni zašto, na primer: "zbog prisustva sastojaka sa narandžaste liste bez GF potvrde koji mogu nositi rizik od glutena (npr. sadrži sastojke kao što su [sastojak1], [sastojak2] koji zahtevaju proveru porekla zbog mogućeg glutena)" ILI "zbog 'labelingInfo' ('Nema GF oznake.') koji sugeriše oprez iako nema direktnih izvora glutena."
  Ako je proizvod AOECS sertifikovan ali sadrži frazu o unakrsnoj kontaminaciji glutenom, navedi da sertifikat pokriva taj rizik, ali je opreznost savetovana.
  Ako postoje drugi alergeni koji NISU gluten, dodaj napomenu o njima.

- Za status "rizično":
  Počni sa: "Proizvod je označen kao 'rizično' sa aspekta glutena."
  Objasni zašto, na primer: "zbog prisustva fraza o unakrsnoj kontaminaciji GLUTENOM (npr. 'Upozorenje o mogućim tragovima GLUTENA ([fraza]) je prisutno.')" ILI "zbog većeg broja rizičnih sastojaka bez GF potvrde (npr. 'Sadrži rizične sastojke kao što su [sastojak1] koji mogu sadržati gluten.')."
  Ako 'rezultat' sadrži unos za 'Necertifikovana/neoznačena zob/ovas', dodaj: "Prisutna je necertifikovana zob, što predstavlja visok rizik od glutena."
  Navedi: "Informacija o GF oznaci: {{{labelingInfo}}}."
  Ako postoje drugi alergeni koji NISU gluten, dodaj napomenu o njima.

- Za status "nije bezbedno":
  Počni sa: "Proizvod SADRŽI GLUTEN ili sastojke visokog rizika od glutena i NIJE BEZBEDAN za osobe sa celijakijom."
  Navedi ključne sastojke iz 'rezultat' sa ocenom 'nije bezbedno': "Identifikovani su sledeći izvori glutena ili visokorizični sastojci: [navedi sastojke]."
  Navedi: "Informacija o GF oznaci: {{{labelingInfo}}}."
  Ako postoje drugi alergeni koji NISU gluten, dodaj napomenu o njima.

Obavezno prilagodi ove obrasce konkretnim nalazima iz 'rezultat' niza i vrednosti 'labelingInfo'. Ako nema rizičnih ili nebezbednih sastojaka za nabrajanje u specifičnoj kategoriji, izostavi taj deo rečenice ili ga prikladno prilagodi.

Lista sastojaka za analizu:
\`{{{declarationText}}}\`
Informacije o GF oznaci: \`{{{labelingInfo}}}\`
`,
});

// Define the analyzeDeclarationFlow using ai.defineFlow
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
            const lowerSastojak = item.sastojak.toLowerCase();
            if (lowerSastojak.includes("gluten") || lowerSastojak.includes("pšeni") || lowerSastojak.includes("ječm") || lowerSastojak.includes("raž")) {
                item.kategorijaRizika = "gluten";
            } else if (lowerSastojak.includes("može sadržati") || lowerSastojak.includes("tragove")) {
                 if (lowerSastojak.includes("pšenice") || lowerSastojak.includes("glutena") || lowerSastojak.includes("ječma") || lowerSastojak.includes("raži")) {
                    item.kategorijaRizika = "unakrsna kontaminacija glutenom";
                 } else {
                    item.kategorijaRizika = "unakrsna kontaminacija";
                 }
            } else if (item.ocena === "rizično – proveriti poreklo"){
               item.kategorijaRizika = "nepoznato poreklo (rizik od glutena)";
            } else {
                // Pokušaj da se kategoriše na osnovu E-broja ili generičkog termina ako je moguće
                if (/^E\d+/.test(lowerSastojak) || ["skrob", "maltodekstrin", "dekstroza", "aroma", "emulgator", "zgušnjivač", "stabilizator"].some(term => lowerSastojak.includes(term))) {
                    item.kategorijaRizika = "aditiv (rizik od glutena)";
                } else {
                    item.kategorijaRizika = "nepoznato (rizik od glutena)";
                }
            }
        }
      });
    }
    return output!;
  }
);

    

    