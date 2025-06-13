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


export async function analyzeDeclaration(input: AnalyzeDeclarationInput): Promise<AnalyzeDeclarationOutput> {
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
*   slad (ekstrakt slada, sladni sirup, aroma slada / malt, malt extract, malt syrup, malt flavor) (osim ako je jasno navedeno da je bezglutenski i deo AOECS sertifikata)
*   pivski kvasac (brewer’s yeast)
*   pšenični skrob (wheat starch) - ako NIJE eksplicitno deklarisan kao "bezglutenski pšenični skrob" ili ako proizvod nema 'aoecs'/'gf_text' oznaku koja pokriva ovaj sastojak. Bezglutenski pšenični skrob koji zadovoljava EU regulativu (<20ppm) je siguran.

**🟡 SPECIFIČNI RIZIČNI SASTOJCI I E-BROJEVI:**
Ako se u 'declarationText' nalazi neki od sledećih E-brojeva ili sastojaka, postupi prema datim smernicama za 'ocena' i 'napomena', uzimajući u obzir 'labelingInfo'. Sastojak u 'rezultat' nizu treba da bude E-broj sam po sebi (npr. "E1404") ili naziv sastojka (npr. "glukozni sirup").

    *   **E-Brojevi sa Visokim Rizikom:**
        *   E1404 (modifikovani skrob): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Može biti dobijen iz žitarica koje sadrže gluten – provera porekla neophodna.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Može biti dobijen iz žitarica koje sadrže gluten – provera porekla neophodna. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1410 (modifikovani skrob): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Biljno poreklo mora biti navedeno ako postoji rizik od glutena.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Biljno poreklo mora biti navedeno ako postoji rizik od glutena. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1412 (modifikovani skrob): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Može sadržati gluten ako potiče iz pšenice, raži, ječma ili ovsa.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Može sadržati gluten ako potiče iz pšenice, raži, ječma ili ovsa. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1413 (modifikovani skrob): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Nije bezbedan bez potvrde o poreklu – često derivat glutenskih žitarica.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Nije bezbedan bez potvrde o poreklu – često derivat glutenskih žitarica. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1414 (acetilarni diskrob fosfat): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Može biti pšeničnog porekla – obavezna provera.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Može biti pšeničnog porekla – obavezna provera. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1420 (acetilizirani skrob): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Sadrži rizik od glutena bez deklaracije o poreklu.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Sadrži rizik od glutena bez deklaracije o poreklu. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1422 (acetilarni diskrob adipat): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Poreklo može uključivati pšenicu – rizik za osobe sa celijakijom.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Poreklo može uključivati pšenicu – rizik za osobe sa celijakijom. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1440 (hidroksipropilen skrob): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Mora biti testiran na gluten ako poreklo nije navedeno.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Mora biti testiran na gluten ako poreklo nije navedeno. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."
        *   E1442 (hidroksipropilen diskrob fosfat): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "nije bezbedno", 'napomena': "Može biti glutenskog porekla – obavezna provera porekla.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Može biti glutenskog porekla – obavezna provera porekla. Proizvod ima GF oznaku koja bi trebalo da pokriva ovaj sastojak, ali je oprez preporučljiv."

    *   **E-Brojevi i Sastojci sa Umerenim Rizikom:**
        *   E150a (karamel boja): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Neki oblici karamel boje mogu biti iz žita – provera poželjna.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Neki oblici karamel boje mogu biti iz žita – provera poželjna. Smatra se bezbednim zbog GF oznake/sertifikata."
        *   E150b (karamel boja): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Može sadržati ostatke iz glutenskih izvora – potreban oprez.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Može sadržati ostatke iz glutenskih izvora – potreban oprez. Smatra se bezbednim zbog GF oznake/sertifikata."
        *   E150c (karamel boja (amonijačna)): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Rizik postoji ako se koristi žitarica kao izvor šećera za karamelizaciju.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Rizik postoji ako se koristi žitarica kao izvor šećera za karamelizaciju. Smatra se bezbednim zbog GF oznake/sertifikata."
        *   E150d (karamel boja (amonijum-sulfatna)): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Moguće glutensko poreklo – dodatna provera preporučena.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Moguće glutensko poreklo – dodatna provera preporučena. Smatra se bezbednim zbog GF oznake/sertifikata."
        *   E575 (glukonodelta lakton): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Nema dokaza o prisustvu glutena, ali se oprez savetuje kod industrijske prerade.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Nema dokaza o prisustvu glutena, ali se oprez savetuje kod industrijske prerade. Smatra se bezbednim zbog GF oznake/sertifikata."
        *   glukozni sirup: Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Ako je na bazi pšenice ili ječma – može sadržati gluten.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Ako je na bazi pšenice ili ječma – može sadržati gluten. Smatra se bezbednim zbog GF oznake/sertifikata (EU regulativa izuzima glukozne sirupe na bazi pšenice/ječma).". Posebno obrati pažnju ako je eksplicitno navedeno "glukozni sirup (pšenica)" - u tom slučaju je "sigurno" po EU regulativi, čak i bez GF oznake, ali ako nema GF oznake, napomena treba da glasi: "Prema EU regulativi, glukozni sirup na bazi pšenice je bezbedan. Preporučuje se oprez ako nema GF oznake za dodatnu sigurnost."
        *   maltodekstrin: Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Ako nije jasno označeno poreklo, može biti pšeničnog porekla.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Ako nije jasno označeno poreklo, može biti pšeničnog porekla. Smatra se bezbednim zbog GF oznake/sertifikata (EU regulativa izuzima maltodekstrin na bazi pšenice).". Posebno obrati pažnju ako je eksplicitno navedeno "maltodekstrin (pšenica)" - u tom slučaju je "sigurno" po EU regulativi, čak i bez GF oznake, ali ako nema GF oznake, napomena treba da glasi: "Prema EU regulativi, maltodekstrin na bazi pšenice je bezbedan. Preporučuje se oprez ako nema GF oznake za dodatnu sigurnost."
        *   žitni destilat: Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena': "rizično – proveriti poreklo", 'napomena': "Etanol na bazi žitarica može zadržati tragove glutena – zavisi od stepena pročišćenja.". Ako 'labelingInfo' jeste 'aoecs' ili 'gf_text', 'ocena': "sigurno", 'napomena': "Etanol na bazi žitarica može zadržati tragove glutena – zavisi od stepena pročišćenja. Smatra se bezbednim zbog GF oznake/sertifikata (EU regulativa izuzima žitne destilate za alkoholna pića)."

**🟠 NARANDŽASTA LISTA (Opšti uslovno dozvoljeni sastojci - koristi za sastojke koji NISU pokriveni gornjom SPECIFIČNOM listom):**
Ovi sastojci zahtevaju proveru 'labelingInfo' ili eksplicitnu GF deklaraciju na samom sastojku.
*   Ako je 'labelingInfo' 'aoecs' ili 'gf_text', ILI ako je sastojak eksplicitno deklarisan kao bezglutenski (npr. "bezglutenski pšenični skrob", "dekstrin (kukuruzni)"): 'ocena' je "sigurno", 'napomena' treba da objasni zašto (npr. "Smatra se bezbednim zbog GF oznake/sertifikata.").
*   Ako 'labelingInfo' nije 'aoecs' ili 'gf_text' (tj. 'none' ili 'unknown') I sastojak NIJE eksplicitno deklarisan kao bezglutenski: 'ocena' je "rizično – proveriti poreklo", 'napomena' treba da ukaže na potencijalni rizik (npr. "Poreklo/prerada nije potvrđena kao bezglutenska.").
    *   Primeri (ako nisu pokriveni specifičnom listom iznad): dekstrin (dextrin - ako nije jasno iz kukuruza/krompira), prirodne arome (natural flavors), ekstrakt kvasca (yeast extract), aroma vanile (vanilla flavor - ne vanilin).
    *   Specifično za "pšenični dekstrin" ili "dekstrin (pšenica)": ako nije jasno navedeno da je bezbedan za celijakiju (npr. obrađen da bude GF ili izuzetak), 'ocena' je "nije bezbedno". Ako je navedeno "dekstrin (kukuruzni)", onda je "sigurno".
    *   "Vanilin": Ako je naveden samo kao "vanilin", 'ocena' je "sigurno". Ako je "aroma vanile", primeni opšte pravilo za arome sa narandžaste liste.
    *   Generički termini kao "zgušnjivač", "stabilizator", "emulgator" (ako nisu specifični E-brojevi sa liste iznad): Ako 'labelingInfo' nije 'aoecs' ili 'gf_text', 'ocena' je "rizično – proveriti poreklo" sa napomenom "Potrebno proveriti poreklo [termina]". Ako je 'labelingInfo' 'aoecs' ili 'gf_text', 'ocena' je "sigurno".

**✅ ZELENA LISTA (Generalno bezbedni sastojci):**
'Ocena' je "sigurno".
*   Prirodno bezglutenske žitarice: pirinač (rice), kukuruz (corn), kinoa (quinoa), proso (millet), sirak (sorghum), heljda (buckwheat), amarant (amaranth), krompir (potato), tapioka (tapioca), aru prah (arrowroot), tef (teff), juka (yucca).
*   Ostala prirodno bezglutenska hrana: meso, riba, jaja, mlečni proizvodi (osim sladnog mleka), povrće, voće, mahunarke, orašasti plodovi (nuts).
*   Čist vanilin ekstrakt, sintetički vanilin.
*   Zgušnjivač E415 (ksantan guma) je obično "sigurno". Sojin lecitin je "sigurno".

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

**💡 DODATNA POMOĆ ZA KLASIFIKACIJU RIZIKA (koristi ovo da informišeš svoju ocenu i napomene):**
*   **Visok rizik (🛑):** Opisuje poznate izvore glutena – sastojci koji sadrže gluten ili su visoko kontaminirani. Ocena je generalno "nije bezbedno".
    *   Primeri: pšenično brašno, ječam, raž, ječmeni slad, pšenični skrob (bez GF potvrde).
*   **Umeren rizik (⚠️):** Opisuje sastojke nepoznatog porekla – često su bez glutena, ali nema garancije. Ako nema GF potvrde, ocena je "rizično – proveriti poreklo".
    *   Primeri: glukozni sirup (ako izvor nije GF ili nije izuzetak), modifikovani skrob (ako izvor nije GF), emulgator E471, arome (ako izvor nije GF), E472b (estri mono- i diglicerida masnih kiselina sa mlečnom kiselinom - mogu biti problematični ako su na bazi glutenskih žitarica).
*   **Nizak rizik (🟡):** Opisuje sastojke koji su uglavnom bez glutena, ali ne uvek potvrđeno – treba obratiti pažnju. Ako nema GF potvrde, ocena je često "rizično – proveriti poreklo", ali uz napomenu da je rizik manji ili da je sastojak obično bezbedan.
    *   Primeri: E410 (karuba guma/locust bean gum), E412 (guar guma), ekstrakt vanile (proveriti nosač i alkohol), karagenan (E407), guma arabika (E414).

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

Generiši 'finalnoObrazlozenje' prema sledećim smernicama, zavisno od 'ukupnaProcenaBezbednosti' i 'poverenjeUkupneProcene':

    *   **Ako je 'ukupnaProcenaBezbednosti' "sigurno" I 'poverenjeUkupneProcene' >= 0.9:**
        Koristi obrazac: "Proizvod ne sadrži sastojke koji sadrže gluten niti sumnjive dodatke. Jasno je označen kao bezglutenski ili sadrži relevantnu sertifikaciju (GF oznaka: {{{labelingInfo}}}). Nema identifikovanih rizičnih sastojaka na osnovu dostavljene liste."
        Ako je 'labelingInfo' 'none' ili 'unknown' a ipak je procenjeno kao "sigurno" (npr. zbog kompletno "zelene" liste sastojaka), prilagodi: "Proizvod ne sadrži direktne izvore glutena na osnovu dostavljene liste. Iako nema eksplicitne GF oznake (GF oznaka: {{{labelingInfo}}}), analiza sastojaka ukazuje na verovatnu bezbednost. Za potpunu sigurnost, preporučuje se provera sa proizvođačem."

    *   **Ako je 'ukupnaProcenaBezbednosti' "rizično" ILI "potrebna pažnja":**
        Formuliši obrazloženje na sledeći način: "Proizvod ne sadrži direktne izvore glutena, ali uključuje sastojke čije poreklo nije potvrđeno kao bezglutensko (npr. *AI, ovde navedi listu sastojaka iz 'rezultat' koji imaju ocenu 'rizično – proveriti poreklo', odvojene zarezom*). Prisutna GF oznaka je '{{{labelingInfo}}}'. Postoji *AI, ovde opiši nivo rizika (npr. umeren, umeren do nizak, nizak) na osnovu 'poverenjeUkupneProcene'*. Tipovi rizika uključuju: *AI, ovde navedi relevantne tipove rizika koje si identifikovao, kao što su 'moguća unakrsna kontaminacija (ako postoje fraze 'može sadržati')', 'nepoznat izvor sastojaka (ako postoje sastojci sa narandžaste ili specifične liste bez GF potvrde)', 'nedostatak GF deklaracije (ako je labelingInfo 'none')', 'nedostatak informacija o GF deklaraciji (ako je labelingInfo 'unknown')', 'potrebna pažnja zbog sertifikovanog ovsa (ako je relevantno)'*."
        Obavezno navedi relevantne rizične sastojke i tipove rizika.

    *   **Ako je 'ukupnaProcenaBezbednosti' "nije bezbedno":**
        Formuliši obrazloženje na sledeći način: "Proizvod sadrži sastojke koji su poznati izvori glutena (npr. *AI, ovde navedi listu sastojaka iz 'rezultat' koji imaju ocenu 'nije bezbedno', odvojene zarezom*). Nije bezglutenski i nije pogodan za osobe sa celijakijom. Prisutna GF oznaka je '{{{labelingInfo}}}'."
        Ako je 'labelingInfo' 'aoecs' ili 'gf_text' a ipak je ocenjen kao "nije bezbedno", dodaj: "Uprkos GF oznaci (GF oznaka: {{{labelingInfo}}}), prisustvo *AI, ovde navedi listu sastojaka iz 'rezultat' koji imaju ocenu 'nije bezbedno', odvojene zarezom* čini proizvod nebezbednim."

Obavezno prilagodi ove obrasce konkretnim nalazima iz 'rezultat' niza i vrednosti 'labelingInfo'. Ako nema rizičnih ili nebezbednih sastojaka za nabrajanje u specifičnoj kategoriji, izostavi taj deo rečenice ili ga prikladno prilagodi.

**Primeri za AI:**
*   Ulaz: declarationText: "gluten-free wheat starch, sugar, salt", labelingInfo: "gf_text"
    Očekivani deo 'rezultat': [{"sastojak": "bezglutenski pšenični skrob", "ocena": "sigurno", "napomena": "Deklarisano kao bezglutensko i zadovoljava EU regulativu."}]
    Očekivana 'ukupnaProcenaBezbednosti': "sigurno"
    Očekivano 'finalnoObrazlozenje': "Proizvod ne sadrži sastojke koji sadrže gluten niti sumnjive dodatke. Jasno je označen kao bezglutenski ili sadrži relevantnu sertifikaciju (GF oznaka: gf_text). Nema identifikovanih rizičnih sastojaka na osnovu dostavljene liste."
*   Ulaz: declarationText: "ječmeni slad, šećer", labelingInfo: "none"
    Očekivani deo 'rezultat': [{"sastojak": "ječmeni slad", "ocena": "nije bezbedno", "napomena": "Ječam sadrži gluten."}]
    Očekivana 'ukupnaProcenaBezbednosti': "nije bezbedno"
    Očekivano 'finalnoObrazlozenje': "Proizvod sadrži sastojke koji su poznati izvori glutena (npr. ječmeni slad). Nije bezglutenski i nije pogodan za osobe sa celijakijom. Prisutna GF oznaka je 'none'."
*   Ulaz: declarationText: "pirinčano brašno, može sadržati tragove pšenice", labelingInfo: "none"
    Očekivani deo 'rezultat': [{"sastojak": "pirinčano brašno", "ocena": "sigurno"}, {"sastojak": "Fraza: može sadržati tragove pšenice", "ocena": "rizično – proveriti poreklo", "napomena": "Ukazuje na moguću unakrsnu kontaminaciju."}]
    Očekivana 'ukupnaProcenaBezbednosti': "rizično"
    Očekivano 'finalnoObrazlozenje': "Proizvod ne sadrži direktne izvore glutena, ali uključuje sastojke čije poreklo nije potvrđeno kao bezglutensko (npr. Fraza: može sadržati tragove pšenice). Prisutna GF oznaka je 'none'. Postoji visok rizik. Tipovi rizika uključuju: moguća unakrsna kontaminacija (ako postoje fraze 'može sadržati'), nedostatak GF deklaracije."


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
    



    

    

