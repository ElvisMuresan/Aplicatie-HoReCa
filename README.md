# Aplicație HoReCa – Sistem de Management pentru Restaurant

## Descriere

Aplicație web full-stack destinată managementului unui restaurant, cu funcționalități pentru clienți (meniu, rezervări, comenzi, feedback, autentificare) și pentru administratori (gestionare produse, comenzi, rezervări, feedback, rapoarte).

Tehnologii utilizate: **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Supabase** (bază de date PostgreSQL + autentificare + Edge Functions),

## Repository

Codul sursă complet (fără fișiere binare compilate) este disponibil la adresa:

> [https://github.com/ElvisMuresan/Aplicatie-HoReCa](https://github.com/ElvisMuresan/Aplicatie-HoReCa)

Repository-ul poate fi partajat cu coordonatorul și membrii comisiei de evaluare la cerere.

## Cerințe preliminare

Înainte de instalare, asigurați-vă că aveți instalate:

- [Node.js](https://nodejs.org/) versiunea **18** sau mai nouă
- [npm](https://www.npmjs.com/) versiunea **9** sau mai nouă

---

## Pași de instalare

1. **Clonați repository-ul:**

```bash
git clone https://github.com/ElvisMuresan/Aplicatie-HoReCa.git
cd Aplicatie-HoReCa
```

2. **Instalați dependențele:**

```bash
npm install
```

3. **Configurați variabilele de mediu:**

Creați un fișier `.env` în rădăcina proiectului cu următorul conținut (înlocuiți valorile cu cele din proiectul vostru Supabase):

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

> Valorile reale se obțin din [Supabase Dashboard](https://supabase.com) → Settings → API, respectiv din [Google AI Studio](https://aistudio.google.com) pentru cheia Gemini.

## Lansarea aplicației

### Mod dezvoltare (cu hot-reload):

```bash
npm run dev
```

Aplicația va fi disponibilă la adresa: [http://localhost:5173](http://localhost:5173)

### Mod producție (preview local după build):

```bash
npm run build
npm run preview
```
