import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import Navbar from "../Componente/NavbarAdmin";
import ImageModal from "../Componente/ImageModal";

import ProdusePopulare from "../Componente/ProdusePopulare";

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

type Subcategorie = {
  id: number;
  nume: string;
  produse: Produs[];
};

const Dashboard = () => {
  const [subcategorii, setSubcategorii] = useState<Subcategorie[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<null | 'mancare' | 'bauturi'>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Preluare subcategorii + produse
  const fetchSubcategorii = async (filter: null | 'mancare' | 'bauturi' = null) => {
    setLoading(true);
    let query = supabase
      .from("subcategorii")
      .select(`
        id,
        nume,
        produse:menu(*)
      `)
      .order("id", { ascending: true });
    if (filter === 'mancare') query = query.eq('categorie_id', 1);
    if (filter === 'bauturi') query = query.eq('categorie_id', 2);
    const { data, error } = await query;

    if (error) {
      console.error(error);
    } else {
      // Obținem numărul de recenzii pentru fiecare produs
      const subcategoriiCuRecenzii = await Promise.all(
        (data as Subcategorie[]).map(async (sub) => {
          const produseCuRecenzii = await Promise.all(
            sub.produse.map(async (produs) => {
              const { count } = await supabase
                .from("feedback_produse")
                .select("*", { count: "exact", head: true })
                .eq("produs_id", produs.id);

              return {
                ...produs,
                numar_recenzii: count || 0,
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
    fetchSubcategorii(filter);
  }, [filter]);

  // Funcție pentru a afișa stelele (doar vizualizare)
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4" fill="#facc15" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <svg className="absolute w-4 h-4" fill="#4b5563" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
            </svg>
            <div className="absolute overflow-hidden w-2 h-4">
              <svg className="w-4 h-4" fill="#facc15" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
              </svg>
            </div>
          </div>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4" fill="#4b5563" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        );
      }
    }

    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />

      {/* Zona principală */}
      <div className="flex-1 p-6">
        {/* Dropdown meniuri */}
        <div className="relative inline-block mb-6">
          <button
            className="bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 focus:ring-2 focus:ring-orange-500 font-medium rounded-lg text-sm px-4 py-2 flex items-center gap-2"
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            Meniuri
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20">
              <ul className="py-1 text-sm text-gray-300">
                <li>
                  <button onClick={() => { setFilter(null); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-zinc-800">Toate meniurile</button>
                </li>
                <li>
                  <button onClick={() => { setFilter('mancare'); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-zinc-800">Mâncare</button>
                </li>
                <li>
                  <button onClick={() => { setFilter('bauturi'); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-zinc-800">Băuturi</button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* TOP 3 PRODUSE - eliminat, se folosește ProdusePopulare */}

        {/* PRODUSE POPULARE - doar vizualizare */}
        <ProdusePopulare />

        {/* MENIU PRODUSE */}
        {loading ? (
          <p className="text-center text-orange-500 font-semibold animate-pulse">Se încarcă...</p>
        ) : (
          subcategorii.map((sub) => (
            <div key={sub.id} className="mb-12">
              <h2 className="text-2xl font-extrabold mb-6 text-white">{sub.nume}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {sub.produse.filter(p => p.este_activ !== false).map((p) => (
                  <div key={p.id} className="flex flex-col bg-zinc-900 rounded-xl shadow-md hover:shadow-xl overflow-hidden transition border border-zinc-800">
                    {p.imagine && (
                      <div className="w-full h-40 bg-zinc-800 cursor-pointer relative" onClick={() => { setSelectedImage(p.imagine!); setSelectedTitle(p.nume); }}>
                        <img
                          src={p.imagine}
                          alt={p.nume}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col grow">
                      <h3 className="text-lg font-bold text-white">{p.nume}</h3>

                      {/* RATING GOOGLE-STYLE - DOAR VIZUALIZARE */}
                      {p.numar_recenzii && p.numar_recenzii > 0 ? (
                        <div className="flex items-center gap-2 mt-2">
                          {renderStars(p.rating_mediu || 0)}
                          <span className="text-yellow-400 font-semibold text-sm">
                            {p.rating_mediu?.toFixed(1)}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ({p.numar_recenzii} {p.numar_recenzii === 1 ? "recenzie" : "recenzii"})
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-gray-500 text-xs">
                          Nicio recenzie încă
                        </div>
                      )}

                      {p.descriere && <p className="text-gray-400 mt-2 text-sm grow">{p.descriere}</p>}
                      <p className="text-orange-500 font-extrabold mt-3 text-lg">{p.pret} lei</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal imagine */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          title={selectedTitle}
          onClose={() => { setSelectedImage(null); setSelectedTitle(null); }}
        />
      )}
    </div>
  );
};

export default Dashboard;