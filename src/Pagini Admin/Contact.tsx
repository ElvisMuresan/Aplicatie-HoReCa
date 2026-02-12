import { useEffect, useState } from "react";
import NavbarAdmin from "../Componente/NavbarAdmin";
import { supabase } from "../SupabaseClient";

type MesajContact = {
  id: number;
  nume_prenume: string;
  email: string;
  mesaj: string;
  created_at: string;
};

const ContactAdmin = () => {
  const [mesaje, setMesaje] = useState<MesajContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Preia mesajele din Supabase
  const fetchMesaje = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Eroare la preluarea mesajelor:", error);
    } else {
      setMesaje(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMesaje();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* NAVBAR */}
      <NavbarAdmin />

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-extrabold text-white mb-8 border-b border-orange-500 pb-4">
           Mesaje Contact
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-orange-500 font-semibold text-lg animate-pulse">
              Se încarcă mesajele...
            </p>
          </div>
        ) : mesaje.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Nu există mesaje în acest moment.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {mesaje.map((m) => (
              <div
                key={m.id}
                className="bg-liniar-to-br from-gray-900 to-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:border-orange-500 transition-all duration-300"
              >
                {/* Header cu nume și dată */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-700">
                  <div>
                    <h3 className="font-bold text-xl text-orange-500 mb-1">
                      {m.nume_prenume}
                    </h3>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {m.email}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                    {new Date(m.created_at).toLocaleString('ro-RO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Mesaj */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {m.mesaj}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactAdmin;