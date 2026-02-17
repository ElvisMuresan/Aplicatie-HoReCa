import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import NavbarClient from "../Componente/NavbarClient";
import ImageModal from "../Componente/ImageModal";
import Chatbot from "../Componente/ChatBot";
import FeedbackProdusModal from "../Componente/FeedbackProdus";
import ProdusePopulare from "../Componente/ProdusePopulare";
import { useCart } from "../Context/CartContext";
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
  
  // ✅ State pentru autentificare
  const [_isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Modal imagine
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Modal feedback produs
  const [feedbackProdus, setFeedbackProdus] = useState<ProdusExtins | null>(null);

  // ✅ Cart context
  const { addToCart } = useCart();

  // ✅ Verificare autentificare
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
      setCheckingAuth(false);
    };

    checkAuth();

    // ✅ Listener pentru schimbări autentificare
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // 🔄 Refresh când utilizatorul se întoarce pe pagină (după confirmare)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Pagina redevine vizibilă - refresh date...');
        fetchSubcategorii();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filter]);

  // ✅ Handler pentru adăugare în coș
  const handleAddToCart = (produs: ProdusExtins) => {
    addToCart({
      id: produs.id,
      nume: produs.nume,
      pret: produs.pret,
      imagine: produs.imagine,
    });
    
    // Notificare vizuală (poți înlocui cu toast)
    alert(`${produs.nume} a fost adăugat în coș! 🛒`);
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
        {/* PRODUSE POPULARE - pentru toți utilizatorii */}
        <ProdusePopulare 
          onProductClick={(p) => setFeedbackProdus(p)} 
        />

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
                            className="w-full h-full object-cover cursor-zoom-in"
                            loading="lazy"
                            onClick={() => {
                              setSelectedImage(p.imagine!);
                              setSelectedTitle(p.nume);
                            }}
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
                          <p className="text-gray-400 mt-2 text-sm grow">
                            {p.descriere}
                          </p>
                        )}

                        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-800">
                          <div className="flex justify-between items-center">
                            <p className="text-orange-500 font-extrabold text-lg">
                              {p.pret} lei
                            </p>
                            
                            {/* ✅ Buton EVALUEAZĂ - pentru toți utilizatorii */}
                            <button
                              onClick={() => setFeedbackProdus(p)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition border border-zinc-700"
                            >
                              ⭐ Evaluează
                            </button>
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

      {/* MODAL IMAGINE */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          title={selectedTitle}
          onClose={() => {
            setSelectedImage(null);
            setSelectedTitle(null);
          }}
        />
      )}

      {/* MODAL FEEDBACK PRODUS - pentru toți utilizatorii cu verificare email */}
      {feedbackProdus && (
        <FeedbackProdusModal
          produsId={feedbackProdus.id}
          produsNume={feedbackProdus.nume}
          onClose={() => setFeedbackProdus(null)}
          onSuccess={fetchSubcategorii}
          userEmail={userEmail}
        />
      )}

      <Chatbot />
    </div>
  );
};

export default ClientMenu;