import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import NavbarClient from "../Componente/NavbarClient";
import ProductModal from "../Componente/ProductModal";
import Chatbot from "../Componente/ChatBot";
import ProdusePopulare from "../Componente/ProdusePopulare";
import PendingReviewPopup from "../Componente/PendingReviewPopup";
import { useCart } from "../Context/CartContext";
import { useAuth } from "../Context/AuthContext";
import type { Produs } from "../types/Produse";

// Tipuri extinse pentru a include numărul de recenzii și comenzi
type ProdusExtins = Produs & {
  numar_recenzii?: number;
  numar_comenzi?: number;
};

type SubcategorieExtinsa = {
  id: number;
  nume: string;
  produse: ProdusExtins[];
};

const ClientMenu = () => {
  const [subcategorii, setSubcategorii] = useState<SubcategorieExtinsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<null | "mancare" | "bauturi">(null);
  
  // ✅ Auth din context global
  const { user, checkingAuth } = useAuth();
  const isAuthenticated = !!user;
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;
  const [userName, setUserName] = useState<string | null>(null);
  const [showPendingReview, setShowPendingReview] = useState(false);

  // Modal detalii produs
  const [selectedProduct, setSelectedProduct] = useState<ProdusExtins | null>(null);

  // 🎉 State pentru popup adăugare în coș
  const [showAddedPopup, setShowAddedPopup] = useState(false);
  const [produsAdded, setProdusAdded] = useState<string>("");

  // ✅ Cart context
  const { addToCart } = useCart();

  // ✅ Încărcăm profilul când userul se schimbă
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("nume")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setUserName(profile?.nume || null);
          setShowPendingReview(true);
        });
    } else {
      setUserName(null);
      setShowPendingReview(false);
    }
  }, [user]);

  const fetchSubcategorii = async () => {
    setLoading(true);

    let query = supabase
      .from("subcategorii")
      .select(`
        id,
        nume,
        produse:menu(*)
      `)
      .order("id");

    if (filter === "mancare") query = query.eq("categorie_id", 1);
    if (filter === "bauturi") query = query.eq("categorie_id", 2);

    const { data } = await query;

    console.log('📊 Date primite de la server:', data);

    // Obținem numărul de recenzii pentru fiecare produs
    if (data) {
      const subcategoriiCuRecenzii = await Promise.all(
        data.map(async (sub: SubcategorieExtinsa) => {
          const produseCuRecenzii = await Promise.all(
            sub.produse.map(async (produs: ProdusExtins) => {
              // Număr recenzii confirmate (sau vechi fără email)
              const { count: countRecenzii } = await supabase
                .from("feedback_produse")
                .select("*", { count: "exact", head: true })
                .eq("produs_id", produs.id)
                .or("email_confirmat.eq.true,email.is.null");

              console.log(`📦 Produs: ${produs.nume} | rating_mediu: ${produs.rating_mediu} | numar_recenzii: ${countRecenzii}`);

              // Număr comenzi pentru acest produs
              const { data: comenziData } = await supabase
                .from("comenzi_produse")
                .select("cantitate")
                .eq("produs_id", produs.id);

              const numarComenzi = comenziData?.reduce((sum, item) => sum + (item.cantitate || 1), 0) || 0;

              return {
                ...produs,
                numar_recenzii: countRecenzii || 0,
                numar_comenzi: numarComenzi,
              };
            })
          );

          return {
            ...sub,
            produse: produseCuRecenzii,
          };
        })
      );

      setSubcategorii(subcategoriiCuRecenzii);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSubcategorii();
  }, [filter]);



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

  // Funcție pentru a afișa stelele
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <svg
            key={i}
            className="w-4 h-4"
            fill="#facc15"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <svg
              className="absolute w-4 h-4"
              fill="#4b5563"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
            </svg>
            <div className="absolute overflow-hidden w-2 h-4">
              <svg
                className="w-4 h-4"
                fill="#facc15"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
              </svg>
            </div>
          </div>
        );
      } else {
        stars.push(
          <svg
            key={i}
            className="w-4 h-4"
            fill="#4b5563"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        );
      }
    }

    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="min-h-screen bg-black">
      <NavbarClient filter={filter} setFilter={setFilter} />

      <div className="p-4">
        {/* PRODUSE POPULARE */}
        <ProdusePopulare />

        {/* MENIU NORMAL */}
        {loading || checkingAuth ? (
          <p className="text-center mt-10 text-orange-500 font-semibold animate-pulse">
            Se încarcă meniul...
          </p>
        ) : (
          subcategorii.map((sub) => (
            <div key={sub.id} className="mb-12">
              <h2 className="text-2xl font-extrabold mb-6 text-white">
                {sub.nume}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {sub.produse
                  .filter((p) => p.este_activ !== false)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col bg-zinc-900 rounded-xl shadow-md hover:shadow-xl transition-shadow 
                      duration-300 overflow-hidden border border-zinc-800"
                    >
                      {p.imagine && (
                        <div className="w-full h-32 sm:h-36 md:h-40 bg-zinc-800 relative">
                          <img
                            src={`${p.imagine}?width=600&height=400&resize=cover`}
                            alt={p.nume}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="p-4 flex flex-col grow">
                        <h3 className="text-lg font-bold text-white">
                          {p.nume}
                        </h3>

                        {/* RATING GOOGLE-STYLE + NUMĂR COMENZI */}
                        <div className="mt-2 space-y-1">
                          {p.numar_recenzii && p.numar_recenzii > 0 ? (
                            <div className="flex items-center gap-2">
                              {renderStars(p.rating_mediu || 0)}
                              <span className="text-yellow-400 font-semibold text-sm">
                                {p.rating_mediu?.toFixed(1)}
                              </span>
                              <span className="text-gray-500 text-xs">
                                ({p.numar_recenzii} {p.numar_recenzii === 1 ? "recenzie" : "recenzii"})
                              </span>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs">
                              Nicio recenzie încă
                            </div>
                          )}
                          {/* NUMĂR COMENZI */}
                          {p.numar_comenzi && p.numar_comenzi > 0 && (
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                              <span>🛒</span>
                              <span>Comandat de {p.numar_comenzi} {p.numar_comenzi === 1 ? "ori" : "ori"}</span>
                            </div>
                          )}
                        </div>

                        {p.descriere && (
                          <div className="mt-2">
                            <p className="text-gray-400 text-sm line-clamp-3">
                              {p.descriere}
                            </p>
                            {p.descriere.length > 100 && (
                              <button
                                onClick={() => setSelectedProduct(p)}
                                className="text-orange-500 hover:text-orange-400 text-xs font-semibold mt-1 transition"
                              >
                                Mai multe...
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-800">
                          <div className="flex justify-between items-center">
                            <p className="text-orange-500 font-extrabold text-lg">
                              {p.pret} lei
                            </p>
                          </div>

                          {/* ✅ Buton ADAUGĂ ÎN COȘ - pentru toți utilizatorii */}
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
          ))
        )}
      </div>

      {/* MODAL DETALII PRODUS */}
      {selectedProduct && (
        <ProductModal
          produs={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => {
            addToCart({
              id: p.id,
              nume: p.nume,
              pret: p.pret,
              imagine: p.imagine,
            });
            // 🎉 Afișează popup frumos și din modal
            setProdusAdded(p.nume);
            setShowAddedPopup(true);
            setTimeout(() => setShowAddedPopup(false), 3000);
          }}
        />
      )}

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

      {/* POPUP EVALUARE ULTIMA COMANDĂ - apare automat la autentificare */}
      {showPendingReview && isAuthenticated && userId && userEmail && (
        <PendingReviewPopup
          userId={userId}
          userEmail={userEmail}
          userName={userName || undefined}
          onClose={() => setShowPendingReview(false)}
          onSuccess={fetchSubcategorii}
        />
      )}

      <Chatbot />
    </div>
  );
};

export default ClientMenu;