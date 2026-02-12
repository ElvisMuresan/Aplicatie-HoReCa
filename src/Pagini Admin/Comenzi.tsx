import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import Navbar from "../Componente/NavbarAdmin";

// Tipuri pentru comenzi
type ComandaProdus = {
  id: number;
  produs_id: number;
  cantitate: number;
  pret_unitar: number;
  menu?: {
    nume: string;
    imagine?: string | null;
  };
};

type Comanda = {
  id: number;
  user_id?: string | null;
  status: string;
  total: number;
  observatii?: string | null;
  created_at: string;
  // Câmpuri noi pentru guest și comenzi directe
  nume_client?: string | null;
  email_client?: string | null;
  telefon_client?: string | null;
  ora_ridicare?: string | null;
  comenzi_produse: ComandaProdus[];
  profiles?: {
    nume?: string;
    telefon?: string;
    email?: string;
  };
};

const Comenzi = () => {
  const [comenzi, setComenzi] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Statistici
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  });

  // Încărcăm comenzile
  const fetchComenzi = async () => {
    setLoading(true);

    let query = supabase
      .from("comenzi")
      .select(`
        *,
        comenzi_produse(
          *,
          menu(nume, imagine)
        ),
        profiles(nume, telefon)
      `)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Eroare la încărcarea comenzilor:", error);
    } else {
      setComenzi(data || []);
      
      // Calculăm statisticile
      const allOrders = data || [];
      setStats({
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === "pending").length,
        confirmed: allOrders.filter(o => o.status === "confirmed").length,
        preparing: allOrders.filter(o => o.status === "preparing").length,
        ready: allOrders.filter(o => o.status === "ready").length,
        completed: allOrders.filter(o => o.status === "completed").length,
        cancelled: allOrders.filter(o => o.status === "cancelled").length,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchComenzi();
  }, [filter]);

  // Actualizează statusul comenzii
  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from("comenzi")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Eroare la actualizarea statusului:", error);
      alert("Eroare la actualizarea statusului!");
    } else {
      fetchComenzi();
    }
  };

  // Formatare dată
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-blue-500";
      case "preparing": return "bg-purple-500";
      case "ready": return "bg-green-500";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "În așteptare";
      case "confirmed": return "Confirmată";
      case "preparing": return "Se prepară";
      case "ready": return "Gata de ridicare";
      case "completed": return "Finalizată";
      case "cancelled": return "Anulată";
      default: return status;
    }
  };

  // Următorul status posibil
  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case "pending": return "confirmed";
      case "confirmed": return "preparing";
      case "preparing": return "ready";
      case "ready": return "completed";
      default: return null;
    }
  };

  const getNextStatusText = (currentStatus: string): string | null => {
    const next = getNextStatus(currentStatus);
    return next ? getStatusText(next) : null;
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            📦 Gestionare Comenzi
          </h1>
          <p className="text-gray-400">
            Vizualizează și gestionează toate comenzile clienților
          </p>
        </div>

        {/* STATISTICI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div 
            onClick={() => setFilter("all")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-orange-500 ${filter === "all" ? "border-orange-500" : "border-zinc-800"}`}
          >
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div 
            onClick={() => setFilter("pending")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-yellow-500 ${filter === "pending" ? "border-yellow-500" : "border-zinc-800"}`}
          >
            <p className="text-yellow-400 text-sm">În așteptare</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div 
            onClick={() => setFilter("confirmed")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-blue-500 ${filter === "confirmed" ? "border-blue-500" : "border-zinc-800"}`}
          >
            <p className="text-blue-400 text-sm">Confirmate</p>
            <p className="text-2xl font-bold text-blue-500">{stats.confirmed}</p>
          </div>
          <div 
            onClick={() => setFilter("preparing")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-purple-500 ${filter === "preparing" ? "border-purple-500" : "border-zinc-800"}`}
          >
            <p className="text-purple-400 text-sm">Se prepară</p>
            <p className="text-2xl font-bold text-purple-500">{stats.preparing}</p>
          </div>
          <div 
            onClick={() => setFilter("ready")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-green-500 ${filter === "ready" ? "border-green-500" : "border-zinc-800"}`}
          >
            <p className="text-green-400 text-sm">Gata</p>
            <p className="text-2xl font-bold text-green-500">{stats.ready}</p>
          </div>
          <div 
            onClick={() => setFilter("completed")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-gray-500 ${filter === "completed" ? "border-gray-500" : "border-zinc-800"}`}
          >
            <p className="text-gray-400 text-sm">Finalizate</p>
            <p className="text-2xl font-bold text-gray-500">{stats.completed}</p>
          </div>
          <div 
            onClick={() => setFilter("cancelled")}
            className={`bg-zinc-900 rounded-xl p-4 border cursor-pointer transition hover:border-red-500 ${filter === "cancelled" ? "border-red-500" : "border-zinc-800"}`}
          >
            <p className="text-red-400 text-sm">Anulate</p>
            <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
          </div>
        </div>

        {/* LISTA COMENZI */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-orange-500 animate-pulse text-lg">Se încarcă comenzile...</p>
          </div>
        ) : comenzi.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-800">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-white mb-2">Nicio comandă</h2>
            <p className="text-gray-400">
              {filter === "all" 
                ? "Nu există comenzi în sistem." 
                : `Nu există comenzi cu status "${getStatusText(filter)}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comenzi.map((comanda) => {
              // Determinăm numele și telefonul (din guest fields sau profile)
              const numeClient = comanda.nume_client || comanda.profiles?.nume || "Client necunoscut";
              const telefonClient = comanda.telefon_client || comanda.profiles?.telefon || "N/A";
              const emailClient = comanda.email_client || comanda.profiles?.email || "";
              const isGuest = !comanda.user_id;

              return (
              <div
                key={comanda.id}
                className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
              >
                {/* HEADER COMANDĂ */}
                <div 
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition"
                  onClick={() => setExpandedOrder(expandedOrder === comanda.id ? null : comanda.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-zinc-800 rounded-lg p-3">
                      <span className="text-2xl">{isGuest ? "👤" : "🧾"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-white">
                          Comanda #{comanda.id}
                        </h3>
                        <span className={`${getStatusColor(comanda.status)} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                          {getStatusText(comanda.status)}
                        </span>
                        {isGuest && (
                          <span className="bg-purple-500/20 text-purple-400 text-xs font-semibold px-2 py-1 rounded-full">
                            Guest
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {formatDate(comanda.created_at)} • {numeClient} • {telefonClient}
                        {emailClient && <span className="text-gray-500"> • {emailClient}</span>}
                      </p>
                      {comanda.ora_ridicare && (
                        <p className="text-orange-400 text-sm mt-1">
                          ⏰ Ridicare la ora: {comanda.ora_ridicare}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-500">
                        {comanda.total.toFixed(2)} lei
                      </p>
                      <p className="text-gray-500 text-sm">
                        {comanda.comenzi_produse?.length || 0} produse
                      </p>
                    </div>
                    <span className="text-gray-500 text-xl">
                      {expandedOrder === comanda.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* DETALII COMANDĂ (EXPANDABIL) */}
                {expandedOrder === comanda.id && (
                  <div className="border-t border-zinc-800 p-4">
                    {/* INFORMAȚII CLIENT */}
                    <div className="mb-6 bg-zinc-800 rounded-lg p-4">
                      <h4 className="text-gray-300 font-semibold mb-3">👤 Informații client:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Nume:</span>
                          <p className="text-white font-medium">{numeClient}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Telefon:</span>
                          <p className="text-white font-medium">{telefonClient}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="text-white font-medium">{emailClient || "N/A"}</p>
                        </div>
                      </div>
                      {comanda.ora_ridicare && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <span className="text-gray-500">Ora ridicării:</span>
                          <p className="text-orange-400 font-bold text-lg">{comanda.ora_ridicare}</p>
                        </div>
                      )}
                    </div>

                    {/* PRODUSE */}
                    <div className="mb-6">
                      <h4 className="text-gray-300 font-semibold mb-3">Produse comandate:</h4>
                      <div className="space-y-2">
                        {comanda.comenzi_produse?.map((item: ComandaProdus) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 bg-zinc-800 rounded-lg p-3"
                          >
                            {item.menu?.imagine && (
                              <img
                                src={`${item.menu.imagine}?width=60&height=60&resize=cover`}
                                alt={item.menu?.nume}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="grow">
                              <p className="text-white font-medium">
                                {item.menu?.nume || "Produs"}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {item.pret_unitar.toFixed(2)} lei × {item.cantitate}
                              </p>
                            </div>
                            <p className="text-orange-500 font-bold">
                              {(item.pret_unitar * item.cantitate).toFixed(2)} lei
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OBSERVAȚII */}
                    {comanda.observatii && (
                      <div className="mb-6 bg-zinc-800 rounded-lg p-4">
                        <h4 className="text-gray-300 font-semibold mb-2">📝 Observații:</h4>
                        <p className="text-white">{comanda.observatii}</p>
                      </div>
                    )}

                    {/* ACȚIUNI */}
                    <div className="flex flex-wrap gap-3">
                      {/* Buton pentru următorul status */}
                      {getNextStatus(comanda.status) && (
                        <button
                          onClick={() => updateStatus(comanda.id, getNextStatus(comanda.status)!)}
                          className={`${getStatusColor(getNextStatus(comanda.status)!)} hover:opacity-90 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2`}
                        >
                          ✓ Marchează ca "{getNextStatusText(comanda.status)}"
                        </button>
                      )}

                      {/* Buton anulare (doar pentru pending/confirmed) */}
                      {(comanda.status === "pending" || comanda.status === "confirmed") && (
                        <button
                          onClick={() => {
                            if (confirm("Ești sigur că vrei să anulezi această comandă?")) {
                              updateStatus(comanda.id, "cancelled");
                            }
                          }}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                          ✕ Anulează comanda
                        </button>
                      )}

                      {/* Selector manual de status */}
                      <select
                        value={comanda.status}
                        onChange={(e) => updateStatus(comanda.id, e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="pending">În așteptare</option>
                        <option value="confirmed">Confirmată</option>
                        <option value="preparing">Se prepară</option>
                        <option value="ready">Gata de ridicare</option>
                        <option value="completed">Finalizată</option>
                        <option value="cancelled">Anulată</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comenzi;
