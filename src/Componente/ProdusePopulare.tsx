import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import type { Produs } from "../types/Produse";
import { useCart } from "../Context/CartContext";

type ProdusExtins = Produs & {
  numar_comenzi?: number;
  scor_popularitate?: number;
};

const ProdusePopulare = () => {
  const [produsePopulare, setProdusePopulare] = useState<ProdusExtins[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // 🎉 State pentru popup adăugare în coș
  const [showAddedPopup, setShowAddedPopup] = useState(false);
  const [produsAdded, setProdusAdded] = useState<string>("");

  // Eliminat useEffect pentru autentificare

  useEffect(() => {
    const fetchPopulare = async () => {
      const { data } = await supabase
        .from("menu")
        .select("*")
        .eq("este_activ", true)
        .gte("rating_mediu", 3.0); // Doar produse cu rating >= 3.0

      // Pentru fiecare produs, obținem numărul de comenzi și calculăm scorul
      if (data) {
        const produseComplete = await Promise.all(
          data.map(async (produs: Produs) => {
            const { data: comenziData } = await supabase
              .from("comenzi_produse")
              .select("cantitate")
              .eq("produs_id", produs.id);

            const numarComenzi = comenziData?.reduce((sum, item) => sum + (item.cantitate || 1), 0) || 0;

            // ✅ FORMULA SCOR POPULARITATE
            // Scor = (Rating × 0.6) + (log(Comenzi + 1) × 0.4)
            // Rating are greutate 60%, Comenzile 40%
            const rating = produs.rating_mediu || 0;
            const scorComenzi = Math.log10(numarComenzi + 1) * 2; // Normalizat la scară 0-5
            const scorPopularitate = (rating * 0.6) + (scorComenzi * 0.4);

            return {
              ...produs,
              numar_comenzi: numarComenzi,
              scor_popularitate: scorPopularitate,
            };
          })
        );

        // ✅ Sortăm după scorul de popularitate și luăm top 3
        const topProduse = produseComplete
          .sort((a, b) => (b.scor_popularitate || 0) - (a.scor_popularitate || 0))
          .slice(0, 3);

        setProdusePopulare(topProduse);
      }
      
      setLoading(false);
    };

    fetchPopulare();
  }, []);

  // ✅ Handler pentru adăugare în coș
  const handleAddToCart = (produs: ProdusExtins) => {
    addToCart({
      id: produs.id,
      nume: produs.nume,
      pret: produs.pret,
      imagine: produs.imagine,
    });
    
    // 🎉 Afișează popup frumos
    setProdusAdded(produs.nume);
    setShowAddedPopup(true);
    setTimeout(() => setShowAddedPopup(false), 3000);
  };

  if (loading) {
    return (
      <div className="text-center text-orange-500 py-8 animate-pulse">
        Se încarcă produsele populare...
      </div>
    );
  }

  if (produsePopulare.length === 0) return null;

  return (
    <>
      {/* 🎉 POPUP FRUMOS - PRODUS ADĂUGAT ÎN COȘ */}
      {showAddedPopup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in-bottom">
          <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-green-300 min-w-[320px]">
            <div className="flex items-start gap-4">
              <div className="text-4xl animate-bounce">✅</div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">Produs adăugat!</p>
                <p className="text-sm text-green-50 line-clamp-2">{produsAdded}</p>
                <p className="text-xs text-green-100 mt-2 flex items-center gap-1">
                  <span>🛒</span> Găsești produsul în coș
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-3xl font-extrabold mb-6 text-orange-500">
          🔥 Cele mai populare produse
        </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {produsePopulare.map((p, index) => (
          <div
            key={p.id}
            className="flex flex-col bg-liniar-to-br from-orange-900 to-zinc-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-orange-500 relative"
          >
            {/* Badge poziție */}
            <div className="absolute top-2 left-2 z-10">
              <div className={`
                text-2xl font-bold px-3 py-1 rounded-full
                ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                ${index === 1 ? 'bg-gray-400 text-white' : ''}
                ${index === 2 ? 'bg-orange-600 text-white' : ''}
              `}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
            </div>

            {p.imagine && (
              <div className="w-full h-40 bg-zinc-800 relative">
                <img
                  src={`${p.imagine}?width=600&height=400&resize=cover`}
                  alt={p.nume}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Badge rating */}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 text-sm">
                  ⭐ {p.rating_mediu?.toFixed(1)}
                </div>
              </div>
            )}

            <div className="p-4 flex flex-col grow">
              <h3 className="text-lg font-bold text-white">{p.nume}</h3>

              {p.descriere && (
                <p className="text-gray-300 mt-1 text-sm grow line-clamp-2">
                  {p.descriere}
                </p>
              )}

              {/* STATISTICI PRODUSE */}
              <div className="flex items-center gap-3 mt-2">
                {/* Număr comenzi */}
                {p.numar_comenzi && p.numar_comenzi > 0 && (
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <span>🛒</span>
                    <span>{p.numar_comenzi} {p.numar_comenzi === 1 ? 'comandă' : 'comenzi'}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-700">
                <div className="flex justify-between items-center">
                  <p className="text-orange-400 font-extrabold text-lg">
                    {p.pret} lei
                  </p>
                </div>

                {/* Buton ADAUGĂ ÎN COȘ - pentru toți utilizatorii */}
                <button
                  onClick={() => handleAddToCart(p)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  🛒 Adaugă în coș
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default ProdusePopulare;