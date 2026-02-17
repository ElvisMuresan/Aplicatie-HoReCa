import { useState, useEffect } from "react";
import { supabase } from "../SupabaseClient";

interface ProdusComanda {
  produs_id: number;
  nume: string;
  cantitate: number;
  imagine?: string | null;
}

interface UltimaComanda {
  id: number;
  cod_comanda: string;
  produse: ProdusComanda[];
}

type Props = {
  userId: string;
  userEmail: string;
  userName?: string;
  onClose: () => void;
  onSuccess: () => void;
};

const PendingReviewPopup = ({ userId, userEmail, userName, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(true);
  const [ultimaComanda, setUltimaComanda] = useState<UltimaComanda | null>(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [ratings, setRatings] = useState<{ [key: number]: { rating: number; comentariu: string; hoveredStar: number } }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Verifică dacă există o comandă ne-evaluată
  useEffect(() => {
    checkPendingReview();
  }, [userId]);

  const checkPendingReview = async () => {
    setLoading(true);

    try {
      // Ia ultima comandă a utilizatorului
      const { data: comenzi, error: comenziError } = await supabase
        .from("comenzi")
        .select(`
          id,
          cod_comanda,
          comenzi_produse(
            produs_id,
            cantitate,
            menu(nume, imagine)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (comenziError) throw comenziError;

      if (!comenzi || comenzi.length === 0) {
        setUltimaComanda(null);
        setLoading(false);
        return;
      }

      const comanda = comenzi[0];

      // Verifică dacă această comandă a fost deja evaluată (popup închis)
      const reviewKey = `reviewed_order_${comanda.id}`;
      if (localStorage.getItem(reviewKey)) {
        setUltimaComanda(null);
        setLoading(false);
        return;
      }

      // Verifică dacă produsele din această comandă au fost deja evaluate
      const produseIds = comanda.comenzi_produse.map((p: any) => p.produs_id);
      
      const { data: feedbackExistent, error: feedbackError } = await supabase
        .from("feedback_produse")
        .select("produs_id")
        .eq("cod_referinta", comanda.cod_comanda)
        .in("produs_id", produseIds);

      if (feedbackError) throw feedbackError;

      // Filtrează produsele care nu au fost evaluate încă
      const produseEvaluate = new Set(feedbackExistent?.map(f => f.produs_id) || []);
      const produseDeEvaluat = comanda.comenzi_produse
        .filter((p: any) => !produseEvaluate.has(p.produs_id))
        .map((p: any) => ({
          produs_id: p.produs_id,
          nume: p.menu?.nume || "Produs",
          cantitate: p.cantitate,
          imagine: p.menu?.imagine
        }));

      if (produseDeEvaluat.length === 0) {
        // Toate produsele au fost evaluate
        localStorage.setItem(reviewKey, "true");
        setUltimaComanda(null);
        setLoading(false);
        return;
      }

      setUltimaComanda({
        id: comanda.id,
        cod_comanda: comanda.cod_comanda,
        produse: produseDeEvaluat
      });

      // Inițializează ratings
      const initialRatings: any = {};
      produseDeEvaluat.forEach((p: ProdusComanda) => {
        initialRatings[p.produs_id] = { rating: 0, comentariu: "", hoveredStar: 0 };
      });
      setRatings(initialRatings);

    } catch (err) {
      console.error("Eroare verificare review:", err);
    } finally {
      setLoading(false);
    }
  };

  // Închide popup și marchează ca văzut
  const handleClose = () => {
    if (ultimaComanda) {
      localStorage.setItem(`reviewed_order_${ultimaComanda.id}`, "true");
    }
    onClose();
  };

  // Trimite recenzia pentru produsul curent
  const submitCurrentReview = async () => {
    if (!ultimaComanda) return;

    const produs = ultimaComanda.produse[currentProductIndex];
    const review = ratings[produs.produs_id];

    if (review.rating === 0) {
      return; // Skip dacă nu a dat rating
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("feedback_produse")
        .insert({
          tip_cod: "CMD",
          cod_referinta: ultimaComanda.cod_comanda,
          produs_id: produs.produs_id,
          rating: review.rating,
          comentariu: review.comentariu.trim() || null,
          nume_client: userName || "Client",
          email: userEmail,
          email_confirmat: true
        });

      if (error) throw error;

      // Trecem la următorul produs sau finalizăm
      if (currentProductIndex < ultimaComanda.produse.length - 1) {
        setCurrentProductIndex(currentProductIndex + 1);
      } else {
        // Am terminat toate produsele
        setShowSuccess(true);
        localStorage.setItem(`reviewed_order_${ultimaComanda.id}`, "true");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }

    } catch (err) {
      console.error("Eroare trimitere review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Skip produs curent
  const skipCurrentProduct = () => {
    if (!ultimaComanda) return;

    if (currentProductIndex < ultimaComanda.produse.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    } else {
      // Am terminat
      localStorage.setItem(`reviewed_order_${ultimaComanda.id}`, "true");
      onClose();
    }
  };

  // Render stars
  const renderStars = (produsId: number) => {
    const review = ratings[produsId] || { rating: 0, hoveredStar: 0 };
    const displayRating = review.hoveredStar || review.rating;

    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRatings(prev => ({
              ...prev,
              [produsId]: { ...prev[produsId], rating: star }
            }))}
            onMouseEnter={() => setRatings(prev => ({
              ...prev,
              [produsId]: { ...prev[produsId], hoveredStar: star }
            }))}
            onMouseLeave={() => setRatings(prev => ({
              ...prev,
              [produsId]: { ...prev[produsId], hoveredStar: 0 }
            }))}
            className="text-4xl transition-transform hover:scale-110"
          >
            {star <= displayRating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    );
  };

  // Nu afișa nimic dacă nu există comenzi de evaluat
  if (loading) return null;
  if (!ultimaComanda || ultimaComanda.produse.length === 0) return null;

  // Ecran success
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-700 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Mulțumim!</h2>
          <p className="text-gray-300">Recenziile tale au fost salvate cu succes!</p>
        </div>
      </div>
    );
  }

  const produs = ultimaComanda.produse[currentProductIndex];
  const review = ratings[produs.produs_id] || { rating: 0, comentariu: "", hoveredStar: 0 };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="bg-zinc-900 rounded-2xl max-w-lg w-full border border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-orange-500 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg">🌟 Evaluează comanda ta!</h2>
            <p className="text-orange-100 text-sm">
              Produs {currentProductIndex + 1} din {ultimaComanda.produse.length}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Conținut */}
        <div className="p-6">
          {/* Imaginea produsului */}
          {produs.imagine && (
            <div className="w-full h-40 bg-zinc-800 rounded-xl overflow-hidden mb-4">
              <img
                src={`${produs.imagine}?width=400&height=300&resize=cover`}
                alt={produs.nume}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Nume produs */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {produs.nume}
          </h3>
          <p className="text-gray-400 text-sm text-center mb-6">
            Cantitate comandată: {produs.cantitate}
          </p>

          {/* Rating */}
          <div className="mb-6">
            <p className="text-gray-300 text-center mb-3">Cum ți s-a părut acest produs?</p>
            {renderStars(produs.produs_id)}
          </div>

          {/* Comentariu */}
          <div className="mb-6">
            <textarea
              value={review.comentariu}
              onChange={(e) => setRatings(prev => ({
                ...prev,
                [produs.produs_id]: { ...prev[produs.produs_id], comentariu: e.target.value }
              }))}
              placeholder="Lasă un comentariu (opțional)..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Butoane */}
          <div className="flex gap-3">
            <button
              onClick={skipCurrentProduct}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Sari peste
            </button>
            <button
              onClick={submitCurrentReview}
              disabled={submitting || review.rating === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-600 disabled:text-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              {submitting ? "Se trimite..." : "Trimite recenzia"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-zinc-800 h-2">
          <div 
            className="bg-orange-500 h-full transition-all duration-300"
            style={{ width: `${((currentProductIndex + 1) / ultimaComanda.produse.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PendingReviewPopup;
