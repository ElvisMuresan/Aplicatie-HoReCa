export type Produs = {
  id: number;
  nume: string;
  descriere?: string | null;
  pret: number;
  imagine?: string | null;
  este_activ?: boolean | null;
  rating_mediu?: number;
  numar_comenzi?: number;
};

export type FeedbackProdus = {
  id: number;
  produs_id: number;
  rating: number;
  comentariu?: string | null;
  created_at: string;
  email?: string | null;
  email_confirmat?: boolean;
  confirmation_token?: string | null;
};

export type Subcategorie = {
  id: number;
  nume: string;
  produse: Produs[];
};

// Tipuri pentru comenzi guest
export type ComandaGuest = {
  id: number;
  nume_client: string;
  email_client: string;
  telefon_client: string;
  status: string;
  total: number;
  observatii?: string | null;
  ora_ridicare?: string | null;
  created_at: string;
  user_id?: string | null;
};