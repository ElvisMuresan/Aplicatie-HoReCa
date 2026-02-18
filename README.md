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

---

## Pași de compilare

Compilarea transformă codul sursă TypeScript + React într-un set de fișiere statice optimizate (HTML, CSS, JS) gata de publicare.

**Comanda de compilare pentru producție:**

```bash
npm run build
```

Aceasta execută intern două etape:

1. **`tsc -b`** — verifică și compilează codul TypeScript; orice eroare de tip oprește build-ul
2. **`vite build`** — împachetează și optimizează aplicația (minificare, tree-shaking, code splitting)

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

## Structura principală a proiectului

```
src/
├── Componente/        # Componente reutilizabile (Navbar, Modal, Chatbot etc.)
├── Context/           # Context global (CartContext)
├── Pagini Admin/      # Paginile zonei de administrare
├── Pagini Client/     # Paginile vizibile utilizatorilor
├── types/             # Tipuri TypeScript
├── App.tsx
├── AppRoutes.tsx
└── SupabaseClient.ts  # Configurare client Supabase
supabase/
└── functions/         # Edge Functions Supabase (Deno)
```

## Link ul catre aplicatie hostata

https://aplicatie-ho-re-nq3tcjdsq-elvis-projects-cc4078ae.vercel.app

## Livrable

- Cod sursă complet pe repository (fără `node_modules/` și fără `dist/`)
- Fișier `README.md` cu instrucțiuni de instalare și lansare
- Aplicație deployată live pe Vercel
