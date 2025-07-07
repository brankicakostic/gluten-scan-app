
# Gluten Scan in Firebase Studio

This is a NextJS starter project being built in Firebase Studio.

## Pregled Projekta i Tehnologije

Ovaj projekat je web aplikacija "Gluten Scan", dizajnirana da pomogne korisnicima sa celijakijom i intolerancijom na gluten da lakše identifikuju bezbedne proizvode. Aplikacija je razvijena sa modernim tehnologijama, sa fokusom na brzinu, korisničko iskustvo i pametne funkcionalnosti.

### Osnovni Tehnološki Stack (Tech Stack)

*   **Framework**: **Next.js (App Router)** - Korišćen je za strukturu aplikacije, što omogućava hibridni pristup sa Serverskim i Klijentskim komponentama, optimizovano rutiranje i odlične performanse.
*   **Jezik**: **TypeScript** - Za tipsku sigurnost i bolju organizaciju koda.
*   **UI Biblioteka**: **React** - Kao osnova za izgradnju korisničkog interfejsa.

### Backend i AI Integracije

*   **AI Framework**: **Genkit (by Google)** - Celokupna AI logika se izvršava kroz Genkit flow-ove. Genkit je korišćen za orkestraciju poziva ka AI modelima, definisanje struktuiranih ulaza i izlaza (preko `zod` šema) i omogućava lako prebacivanje između različitih modela.
*   **AI Model**: **Google AI (Gemini)** - U srcu aplikacije je Gemini model, koji se koristi za:
    *   **Analizu Deklaracija**: Pametna analiza teksta sa liste sastojaka kako bi se identifikovali gluten i potencijalni rizici.
    *   **OCR (Optical Character Recognition)**: Ekstrakcija teksta sa slika deklaracija koje korisnici slikaju ili upload-uju.
    *   **Generisanje Sadržaja**: Kreiranje dnevnih saveta za korisnike.
*   **Arhitektura**: Funkcionalnost je implementirana kao **serverless**, gde se Genkit flow-ovi izvršavaju na serverskoj strani (`'use server';`), što smanjuje opterećenje klijenta.

### UI/UX i Stilovi

*   **Komponente**: **ShadCN UI** - Korišćena je kao biblioteka pre-izgrađenih, pristupačnih i lako prilagodljivih UI komponenata (dugmad, kartice, dijalozi, itd.).
*   **Stilizovanje**: **Tailwind CSS** - Za kompletno stilizovanje aplikacije, uključujući i prilagođavanje tema (svetla i tamna) preko CSS varijabli definisanih u `globals.css`.
*   **Ikonice**: **Lucide React** - Za konzistentan i čist set ikonica kroz celu aplikaciju.
*   **State Management**: **React Context API** - Korišćen je za upravljanje globalnim stanjem na klijentskoj strani, kao što su:
    *   `FavoritesContext`: Za čuvanje omiljenih proizvoda.
    *   `ScanLimiterContext`: Za praćenje i ograničavanje broja besplatnih skeniranja.
*   **Mape**: **Leaflet** i **React-Leaflet** - Za prikaz interaktivne mape sa gluten-free lokacijama.

### Ključne Funkcionalnosti

*   **AI Analiza Sastojaka**: Korisnici mogu uneti tekst deklaracije ili slikati deklaraciju, a AI će pružiti detaljan izveštaj o rizicima.
*   **Pretraga i Filtriranje Proizvoda**: Baza proizvoda sa mogućnošću pretrage i filtriranja po kategorijama.
*   **Lista Opoziva (Recalls)**: Stranica koja prikazuje proizvode povučene sa tržišta zbog problema sa glutenom ili drugih rizika.
*   **Sistem Omiljenih Proizvoda (Favorites)**: Mogućnost da korisnici sačuvaju proizvode koji im se dopadaju, uz perzistenciju podataka u `localStorage`.
*   **Ograničenje Besplatnih Skeniranja**: Jednostavan sistem koji prati broj AI analiza po korisniku.
*   **Internacionalizacija (i18n)**: Aplikacija podržava više jezika (`sr`, `en`) koristeći Next.js middleware za rutiranje zasnovano na lokalizaciji.
*   **Responzivni Dizajn**: Aplikacija je potpuno prilagođena za mobilne uređaje, uključujući i donju navigacionu traku za lakše korišćenje (PWA-like feel).
