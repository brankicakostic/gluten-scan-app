# Gluten Scan u Firebase Studiju

Ovo je NextJS starter projekat razvijen u Firebase Studiju.

## Pregled Projekta i Tehnologije

Ovaj projekat je web aplikacija "Gluten Scan", dizajnirana da pomogne korisnicima sa celijakijom i intolerancijom na gluten da lakše identifikuju bezbedne proizvode. Aplikacija je razvijena sa modernim tehnologijama, sa fokusom na brzinu, korisničko iskustvo i pametne funkcionalnosti, a sada je **potpuno integrisana sa Firebase ekosistemom za dinamičko upravljanje podacima**.

## Ključne Tehnologije (Tech Stack)

### Frontend
*   **Framework**: **Next.js (App Router)** - Korišćen je za strukturu aplikacije, što omogućava hibridni pristup sa Serverskim i Klijentskim komponentama, optimizovano rutiranje i odlične performanse.
*   **Jezik**: **TypeScript** - Za tipsku sigurnost i bolju organizaciju koda.
*   **UI Biblioteka**: **React** - Kao osnova za izgradnju korisničkog interfejsa.
*   **Komponente**: **ShadCN UI** - Biblioteka pre-izgrađenih, pristupačnih i lako prilagodljivih UI komponenata.
*   **Stilizovanje**: **Tailwind CSS** - Za kompletno stilizovanje aplikacije, uključujući i prilagođavanje tema.
*   **Ikonice**: **Lucide React** - Za konzistentan i čist set ikonica.
*   **Mape**: **Leaflet** i **React-Leaflet** - Za prikaz interaktivne mape sa gluten-free lokacijama.

### Backend i Baza Podataka
*   **Backend Servisi**: **Firebase** - Korišćen kao primarni backend za aplikaciju.
    *   **Baza Podataka**: **Cloud Firestore** - Svi podaci o proizvodima se čuvaju i dinamički preuzimaju iz Firestore baze, što omogućava centralizovano upravljanje i skalabilnost.
    *   **Skladištenje Fajlova**: **Firebase Storage** - Koristi se za čuvanje i serviranje slika proizvoda.
*   **Servisni Sloj**: Logika za preuzimanje podataka iz Firestore-a je centralizovana u `src/lib/services/product-service.ts`.

### AI Integracije
*   **AI Framework**: **Genkit (by Google)** - Celokupna AI logika se izvršava kroz Genkit flow-ove. Korišćen je za analizu deklaracija, OCR i generisanje dnevnih saveta.
*   **AI Model**: **Google AI (Gemini)** - U srcu aplikacije je Gemini model, koji se koristi za pametnu analizu teksta i slika.
*   **Arhitektura**: Funkcionalnost je implementirana kao **serverless**, gde se Genkit flow-ovi izvršavaju na serverskoj strani (`'use server';`).

## Ključne Funkcionalnosti

*   **Dinamička Baza Proizvoda**: Pretraga i filtriranje proizvoda koji se dinamički učitavaju iz Firestore baze.
*   **Detaljan Prikaz Proizvoda**: Stranice sa detaljnim informacijama o proizvodu, uključujući sastav, nutritivne vrednosti, alergene i status glutena.
*   **AI Analiza Sastojaka**: Korisnici mogu uneti tekst deklaracije ili slikati deklaraciju, a AI će pružiti detaljan izveštaj o rizicima.
*   **Lista Opoziva (Recalls)**: Stranica koja prikazuje proizvode povučene sa tržišta.
*   **Sistem Omiljenih Proizvoda (Favorites)**: Mogućnost da korisnici sačuvaju proizvode, uz perzistenciju podataka u `localStorage`.
*   **Ograničenje Besplatnih Skeniranja**: Jednostavan sistem koji prati broj AI analiza po korisniku.
*   **Internacionalizacija (i18n)**: Podrška za više jezika (`sr`, `en`).

## Postavljanje i Pokretanje Projekta

Da biste pokrenuli projekat lokalno, pratite sledeće korake:

### 1. Preuzimanje zavisnosti
Otvorite terminal u korenu projekta i pokrenite:
```bash
npm install
```

### 2. Firebase Konfiguracija
Aplikacija zahteva konekciju sa Firebase projektom.

**a) Konfiguracija za klijentsku stranu:**
Kreirajte `.env` fajl u korenu projekta i unesite ključeve koje možete naći u Firebase konzoli (`Project Settings -> General`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=VAŠ_API_KLJUČ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=VAŠ_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=VAŠ_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=VAŠ_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=VAŠ_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=VAŠ_APP_ID
```

**b) Konfiguracija za serversku stranu (za uvoz podataka):**
*   U Firebase konzoli idite na `Project Settings -> Service accounts`.
*   Kliknite na **Generate new private key** i preuzmite JSON fajl.
*   Preimenujte fajl u `serviceAccountKey.json` i postavite ga u koren projekta.

### 3. Google AI Konfiguracija (Opciono)
Za funkcionalnost "Dnevnog saveta", potreban vam je Google AI API ključ.
*   Preuzmite ključ sa [Google AI Studio](https://aistudio.google.com/app/apikey).
*   Dodajte ključ u `.env` fajl:
```env
GOOGLE_API_KEY=VAŠ_GOOGLE_AI_KLJUČ
```

### 4. Uvoz Podataka u Firestore
Pre pokretanja aplikacije, potrebno je da uvezete podatke o proizvodima u Firestore. U korenu projekta nalazi se fajl `products-for-database.json`.
Pokrenite skriptu za uvoz sa sledećom komandom:
```bash
node scripts/import-firestore.mjs
```
Ova skripta će automatski popuniti vašu `products` kolekciju u Firestore-u.

### 5. Pokretanje Aplikacije
Kada ste sve podesili, pokrenite razvojni server:
```bash
npm run dev
```
Aplikacija će biti dostupna na `http://localhost:9002`.
