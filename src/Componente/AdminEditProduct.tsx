import { useState } from "react";
import { supabase } from "../SupabaseClient";

type Produs = {
  id: number;
  subcategorie_id: number;
  subcategorie_nume: string;
  nume: string;
  descriere?: string | null;
  pret: number;
  imagine?: string | null;
  este_activ?: boolean | null;
  rating_mediu?: number;
  numar_recenzii?: number;
};

interface AdminEditProductProps {
  produs: Produs;
  onClose: () => void;
  onSaved: (updated: Produs) => void;
}

const AdminEditProduct = ({ produs, onClose, onSaved }: AdminEditProductProps) => {
  const [nume, setNume] = useState(produs.nume);
  const [descriere, setDescriere] = useState(produs.descriere || "");
  const [pret, setPret] = useState<number>(produs.pret);
  const [imagine, setImagine] = useState(produs.imagine || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!nume.trim()) {
      setError("Numele produsului nu poate fi gol.");
      return;
    }
    if (pret <= 0) {
      setError("Prețul trebuie să fie mai mare decât 0.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("menu")
      .update({
        nume: nume.trim(),
        descriere: descriere.trim() || null,
        pret,
        imagine: imagine.trim() || null,
      })
      .eq("id", produs.id);

    if (updateError) {
      setError("Eroare la salvare: " + updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    onSaved({ ...produs, nume: nume.trim(), descriere: descriere.trim() || null, pret, imagine: imagine.trim() || null });

    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-white">✏️ Editează produs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Preview imagine curentă */}
        {imagine && (
          <div className="w-full h-40 bg-zinc-800 overflow-hidden">
            <img
              src={imagine}
              alt={nume}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}

        {/* Formular */}
        <div className="p-5 flex flex-col gap-4">
          {/* Nume */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-1">Nume produs</label>
            <input
              type="text"
              className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              placeholder="Nume produs..."
            />
          </div>

          {/* Descriere */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-1">Descriere</label>
            <textarea
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              value={descriere}
              onChange={(e) => setDescriere(e.target.value)}
              placeholder="Descriere produs..."
            />
          </div>

          {/* Pret */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-1">Preț (lei)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={pret}
              onChange={(e) => setPret(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Imagine URL */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-1">Imagine (URL)</label>
            <input
              type="text"
              className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={imagine}
              onChange={(e) => setImagine(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Mesaje feedback */}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-900/20 border border-green-700 rounded-lg px-3 py-2">
              ✅ Produs actualizat cu succes!
            </p>
          )}

          {/* Butoane */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold py-2 rounded-lg transition"
              disabled={loading}
            >
              Anulează
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
              disabled={loading || success}
            >
              {loading ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditProduct;
