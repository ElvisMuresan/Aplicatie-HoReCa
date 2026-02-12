import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import Navbar from "../Componente/NavbarAdmin";
import ImageModal from "../Componente/ImageModal";

type Produs = {
  id: number;
  subcategorie_id: number;
  subcategorie_nume: string;
  nume: string;
  descriere?: string | null;
  pret: number;
  imagine?: string | null;
  este_activ?: boolean | null;
};

type Subcategorie = {
  id: number;
  nume: string;
  produse: Produs[];
};

const Mancare = () => {
  const [subcategorii, setSubcategorii] = useState<Subcategorie[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Formular adăugare
  const [nume, setNume] = useState("");
  const [descriere, setDescriere] = useState("");
  const [pret, setPret] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [subcategorieSelectata, setSubcategorieSelectata] = useState<number | null>(null);

  const categorieNume = "Mancare";

  // Preluare subcategorii + produse
  const fetchSubcategorii = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("subcategorii")
      .select(`
        id,
        nume,
        produse:menu(*)
      `)
      .eq("categorie_id", 1)
      .order("id", { ascending: true });

    if (error) console.error(error);
    else setSubcategorii(data as Subcategorie[]);

    setLoading(false);
  };

  useEffect(() => {
    fetchSubcategorii();
  }, []);

  // Închide meniul dacă se dă click în afara lui
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Dacă click-ul nu e pe butonul meniului sau pe meniul deschis, închidem
      if (
        !target.closest(".menu-button") &&
        !target.closest(".menu-dropdown")
      ) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Adaugare produs
  const addProdus = async () => {
    try {
      if (!nume || !pret || !subcategorieSelectata)
        return alert("Completează numele, prețul și subcategoria");

      const pretNumeric = parseFloat(pret);
      if (isNaN(pretNumeric)) return alert("Preț invalid");

      const { data: newData, error: insertError } = await supabase
        .from("menu")
        .insert([
          {
            subcategorie_id: subcategorieSelectata,
            nume,
            descriere,
            pret: pretNumeric,
            este_activ: true,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      const produsId = newData.id;

      if (file) {
        let ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "jfif") ext = "jpg";
        const fileName = `${produsId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error("Eroare upload:", uploadError);
          alert("Imaginea nu s-a încărcat corect.");
        } else {
          const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
          const publicUrl = data?.publicUrl ?? null;
          if (publicUrl) {
            await supabase.from("menu").update({ imagine: publicUrl }).eq("id", produsId);
          }
        }
        window.location.reload();
      }

      setNume("");
      setDescriere("");
      setPret("");
      setFile(null);
      setSubcategorieSelectata(null);

      fetchSubcategorii();
    } catch (error) {
      console.error(error);
      alert("A apărut o eroare la adăugarea produsului");
    }
  };

  const deleteProdus = async (produs: Produs) => {
    try {
      if (produs.imagine) {
        const fileName = produs.imagine.split("/").pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from("menu-images")
            .remove([fileName]);
          if (storageError) console.error("Eroare ștergere imagine:", storageError);
        }
      }

      const { error } = await supabase
        .from("menu")
        .delete()
        .eq("id", produs.id);
      if (error) throw error;

      fetchSubcategorii();
    } catch (err) {
      console.error(err);
      alert("Eroare la ștergerea produsului");
    }
  };

  const toggleProdus = async (id: number, activ: boolean) => {
    await supabase.from("menu").update({ este_activ: !activ }).eq("id", id);
    fetchSubcategorii();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4 text-white">{categorieNume}</h1>

        {/* Formular adăugare produs */}
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded shadow flex flex-wrap gap-2">
          <select
            value={subcategorieSelectata ?? ""}
            onChange={(e) => setSubcategorieSelectata(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 text-white p-2 rounded flex-1 min-w-37.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="" disabled>
              Selectează subcategoria
            </option>
            {subcategorii.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nume}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nume"
            value={nume}
            onChange={(e) => setNume(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 p-2 rounded flex-1 min-w-37.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Descriere"
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 p-2 rounded flex-1 min-w-37.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Preț"
            value={pret}
            onChange={(e) => setPret(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 p-2 w-24 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="bg-zinc-800 border border-zinc-700 text-gray-300 p-2 rounded file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
          />
          <button
            onClick={addProdus}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold transition"
          >
            Adaugă
          </button>
        </div>

        {/* Lista produse */}
        {loading ? (
          <p className="text-orange-500 font-semibold animate-pulse">Se încarcă...</p>
        ) : (
          <div>
            {subcategorii.map((sub) => (
              <div key={sub.id} className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-white">{sub.nume}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sub.produse.map((p) => (
                    <div
                      key={p.id}
                      className="bg-zinc-900 border border-zinc-800 p-2 rounded shadow flex flex-col cursor-pointer hover:scale-105 hover:border-orange-500 transform transition-all duration-200 relative"
                    >
                      {p.este_activ === false && (
                        <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-1 rounded-t text-xs font-semibold">
                          Indisponibil
                        </div>
                      )}
                      {p.imagine && (
                        <img
                          src={p.imagine}
                          alt={p.nume}
                          className="w-full h-32 object-cover rounded mb-2"
                          onClick={() => {
                            if (p.imagine) {
                              setSelectedImage(p.imagine);
                              setSelectedTitle(p.nume);
                            }
                          }}
                        />
                      )}
                      <h3 className="font-semibold text-white">{p.nume}</h3>
                      <p className="text-sm text-gray-400">{p.descriere}</p>
                      <p className="font-bold text-orange-500">{p.pret} lei</p>
                      <div className="mt-2 relative flex justify-end">
                        <button
                          onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                          className="menu-button text-gray-300 bg-zinc-800 hover:bg-zinc-700 focus:ring-0 font-medium leading-5 rounded text-sm p-2 focus:outline-none"
                          type="button"
                        >
                          <svg
                            className="w-6 h-6"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeWidth="3"
                              d="M12 6h.01M12 12h.01M12 18h.01"
                            />
                          </svg>
                        </button>
                        {menuOpen === p.id && (
                          <div className="menu-dropdown z-10 absolute right-0 mt-1 bg-zinc-800 border border-zinc-700 shadow-lg rounded">
                            <ul className="p-2 text-sm text-gray-300 font-medium">
                              <li>
                                <button
                                  onClick={() => deleteProdus(p)}
                                  className="inline-flex items-center w-full p-2 hover:bg-red-600 hover:text-white rounded transition"
                                >
                                  Șterge
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => toggleProdus(p.id, p.este_activ ?? true)}
                                  className="inline-flex items-center w-full p-2 hover:bg-yellow-600 hover:text-white rounded transition"
                                >
                                  {p.este_activ ? "Dezactivează" : "Activează"}
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ MODAL IMAGINE */}
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
    </div>
  );
};

export default Mancare;