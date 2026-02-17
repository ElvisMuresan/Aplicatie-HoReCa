import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../SupabaseClient";
import { useCart } from "../Context/CartContext";
import FeedbackProdusModal from "../Componente/FeedbackProdus";
import NavbarClient from "../Componente/NavbarClient";

// Tipuri pentru comenzi (adaptate la structura tabelelor existente)
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
  user_id: string;
  status: string;
  total: number;
  observatii?: string | null;
  created_at: string;
  cod_comanda?: string | null;
  comenzi_produse: ComandaProdus[];
};

const CosCumparaturi = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  
  // State pentru autentificare
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // State pentru formular comandă
  const [numeClient, setNumeClient] = useState("");
  const [emailClient, setEmailClient] = useState("");
  const [telefonClient, setTelefonClient] = useState("");
  const [nota, setNota] = useState("");
  const [oraRidicare, setOraRidicare] = useState("");
  
  // State pentru loading și mesaje
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ultimulCodComanda, setUltimulCodComanda] = useState<string | null>(null);
  
  // State pentru istoricul comenzilor
  const [orders, setOrders] = useState<Comanda[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  
  // State pentru feedback produs
  const [feedbackProdus, setFeedbackProdus] = useState<{id: number, nume: string} | null>(null);

  // Verificare autentificare
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
      setCheckingAuth(false);
      
      // Pre-populăm datele utilizatorului dacă există
      if (session?.user) {
        setEmailClient(session.user.email || "");
     
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("nume, telefon")
  .eq("id", session.user.id)
  .single();

if (profileError) {
  console.error("Eroare la încărcarea profilului:", profileError);
}
          
        if (profile) {
          setNumeClient(profile.nume || "");
          setTelefonClient(profile.telefon || "");
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Încărcăm comenzile utilizatorului
  const fetchOrders = async () => {
    if (!userId) return;
    
    setLoadingOrders(true);
    
    const { data, error } = await supabase
      .from("comenzi")
      .select(`
        *,
        comenzi_produse(
          *,
          menu(nume, imagine)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Eroare la încărcarea comenzilor:", error);
    } else {
      setOrders(data || []);
    }
    
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (isAuthenticated && userId && showOrders) {
      fetchOrders();
    }
  }, [isAuthenticated, userId, showOrders]);

  // Plasează comanda
  const plaseazaComanda = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert("Coșul este gol!");
    return;
  }
  
  if (!numeClient.trim() || !telefonClient.trim() || !oraRidicare || !emailClient.trim()) {
    alert("Te rog completează toate câmpurile obligatorii!");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailClient)) {
    alert("Te rog introdu o adresă de email validă!");
    return;
  }
  
  setLoading(true);
  
  try {
    console.log("📝 Creăm comanda...");
    
    // ✅ Creăm comanda
    const { data: order, error: orderError } = await supabase
      .from("comenzi")
      .insert({
        user_id: userId || null,
        nume_client: numeClient.trim(),
        email_client: emailClient.trim(),
        telefon_client: telefonClient.trim(),
        ora_ridicare: oraRidicare,
        status: "pending",
        total: totalPrice,
        observatii: nota.trim() || null,
      })
      .select()
      .single();
      
    if (orderError) {
      console.error("❌ Eroare comandă:", orderError);
      throw orderError;
    }
    
    console.log("✅ Comandă creată cu ID:", order.id);
    console.log("🔑 Cod comandă:", order.cod_comanda);
    
    // ✅ Adăugăm produsele
    const comandaProduse = cart.map(item => ({
      comanda_id: order.id,
      produs_id: item.id,
      cantitate: item.cantitate,
      pret_unitar: item.pret,
    }));
    
    console.log("📦 Adăugăm produse:", comandaProduse);
    
    const { error: itemsError } = await supabase
      .from("comenzi_produse")
      .insert(comandaProduse);
      
    if (itemsError) {
      console.error("❌ Eroare produse:", itemsError);
      throw itemsError;
    }

    console.log("✅ Produse adăugate");

    // ✅ TRIMITE EMAIL
    console.log('📧 Trimitem email...');
    
    try {
      const produseForEmail = cart.map(item => ({
        nume: item.nume,
        cantitate: item.cantitate,
        pret_unitar: item.pret,
      }));

      const functionUrl = `${SUPABASE_URL}/functions/v1/send-order-confirmation`;

      const emailResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: emailClient.trim(),
          nume_client: numeClient.trim(),
          cod_comanda: order.cod_comanda,
          total: totalPrice,
          ora_ridicare: oraRidicare,
          produse: produseForEmail,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error('❌ Eroare email:', emailData);
      } else {
        console.log('✅ Email trimis!');
      }
    } catch (emailError) {
      console.error('❌ Exception email:', emailError);
    }
    
    // ✅ SUCCES
    setUltimulCodComanda(order.cod_comanda);
    setShowSuccess(true);
    clearCart();
    setNota("");
    setOraRidicare("");
    
    setTimeout(() => {
      setShowSuccess(false);
      setUltimulCodComanda(null);
    }, 8000);
    
  } catch (error: any) {
    console.error("❌ Eroare generală:", error);
    alert(`A apărut o eroare: ${error.message || 'Eroare necunoscută'}`);
  }
  
  setLoading(false);
};

  // Formatare dată
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-orange-500 animate-pulse">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div>
      <NavbarClient filter={null} setFilter={() => {}} />
      <div>
        <div className="max-w-5xl mx-auto p-4">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              🛒 Coșul tău
              {totalItems > 0 && (
                <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
                  {totalItems} {totalItems === 1 ? "produs" : "produse"}
                </span>
              )}
            </h1>
            
            {isAuthenticated && (
              <button
                onClick={() => setShowOrders(!showOrders)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
              >
                📋 {showOrders ? "Coș" : "Comenzile mele"}
              </button>
            )}
          </div>

          {/* MESAJ SUCCES */}
          {showSuccess && (
            <div className="mb-6 p-6 bg-green-900 border border-green-700 rounded-2xl text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Comanda a fost plasată cu succes!
              </h2>
              {ultimulCodComanda && (
                <div className="bg-white/10 rounded-lg p-4 my-4">
                  <p className="text-green-200 text-sm mb-2">Codul comenzii tale:</p>
                  <p className="text-white text-3xl font-mono font-bold tracking-wider">
                    {ultimulCodComanda}
                  </p>
                </div>
              )}
              <p className="text-green-200">
                Vei primi confirmare pe email cu codul comenzii. Mulțumim!
              </p>
            </div>
          )}

          {/* MESAJ PENTRU GUEST - OPȚIONAL AUTENTIFICARE */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-300 text-sm">
                💡 <span className="text-orange-400">Ai cont?</span> Autentifică-te pentru a-ți salva comenzile și a primi reduceri!
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
              >
                Autentifică-te
              </button>
            </div>
          )}

          {/* SECȚIUNEA ISTORIC COMENZI */}
          {showOrders && isAuthenticated ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">📋 Istoricul comenzilor</h2>
              
              {loadingOrders ? (
                <p className="text-orange-500 animate-pulse">Se încarcă comenzile...</p>
              ) : orders.length === 0 ? (
                <div className="bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800">
                  <p className="text-gray-400 text-lg">Nu ai nicio comandă încă.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-gray-400 text-sm">
                            Comanda #{order.id}
                          </p>
                          {order.cod_comanda && (
                            <span className="bg-orange-500/20 text-orange-400 font-mono text-sm font-semibold px-3 py-1 rounded-full">
                              {order.cod_comanda}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          {formatDate(order.created_at)}
                        </p>
                        <p className="text-2xl font-bold text-orange-500 mt-2">
                          {order.total.toFixed(2)} lei
                        </p>
                      </div>
                      <span className={`${getStatusColor(order.status)} text-white text-sm font-semibold px-4 py-2 rounded-full`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    {/* Produse din comandă */}
                    <div className="border-t border-zinc-800 pt-4">
                      <h4 className="text-gray-300 font-semibold mb-3">Produse comandate:</h4>
                      <div className="space-y-2">
                        {order.comenzi_produse?.map((item: ComandaProdus) => (
                          <div 
                            key={item.id} 
                            className="flex justify-between items-center bg-zinc-800 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-white">{item.menu?.nume || "Produs"}</span>
                              <span className="text-gray-400 text-sm">x{item.cantitate}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-orange-500 font-semibold">
                                {(item.pret_unitar * item.cantitate).toFixed(2)} lei
                              </span>
                              {/* Buton evaluează - doar pentru comenzi finalizate */}
                              {(order.status === "completed" || order.status === "ready") && (
                                <button
                                  onClick={() => setFeedbackProdus({ id: item.produs_id, nume: item.menu?.nume || "Produs" })}
                                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-lg transition"
                                >
                                  ⭐ Evaluează
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* SECȚIUNEA COȘ DE CUMPĂRĂTURI */
            <>
              {cart.length === 0 ? (
                <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-800">
                  <div className="text-6xl mb-4">🛒</div>
                  <h2 className="text-2xl font-bold text-white mb-3">Coșul tău este gol</h2>
                  <p className="text-gray-400 mb-6">
                    Adaugă produse din meniu pentru a plasa o comandă.
                  </p>
                  <Link
                    to="/meniu"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg transition"
                  >
                    Vezi Meniul
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LISTA PRODUSE */}
                  <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex gap-4"
                      >
                        {/* Imagine produs */}
                        {item.imagine && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-0 bg-zinc-800">
                            <img
                              src={`${item.imagine}?width=200&height=200&resize=cover`}
                              alt={item.nume}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Detalii produs */}
                        <div className="grow">
                          <h3 className="text-lg font-bold text-white">{item.nume}</h3>
                          <p className="text-orange-500 font-semibold mt-1">
                            {item.pret.toFixed(2)} lei / bucată
                          </p>
                          
                          {/* Controale cantitate */}
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.cantitate - 1)}
                              className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition"
                            >
                              −
                            </button>
                            <span className="text-white font-semibold w-8 text-center">
                              {item.cantitate}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.cantitate + 1)}
                              className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition"
                            >
                              +
                            </button>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-auto text-red-500 hover:text-red-400 text-sm font-semibold"
                            >
                              🗑️ Șterge
                            </button>
                          </div>
                        </div>
                        
                        {/* Preț total per produs */}
                        <div className="text-right flex-0">
                          <p className="text-xl font-bold text-white">
                            {(item.pret * item.cantitate).toFixed(2)} lei
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Buton golire coș */}
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-400 text-sm font-semibold"
                    >
                      🗑️ Golește coșul
                    </button>
                  </div>
                  
                  {/* FORMULAR PLASARE COMANDĂ */}
                  <div className="lg:col-span-1">
                    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
                      <h2 className="text-xl font-bold text-white mb-6">
                        📦 Detalii comandă
                      </h2>
                      
                      <form onSubmit={plaseazaComanda} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Nume complet *
                          </label>
                          <input
                            type="text"
                            value={numeClient}
                            onChange={(e) => setNumeClient(e.target.value)}
                            placeholder="Ion Popescu"
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={emailClient}
                            onChange={(e) => setEmailClient(e.target.value)}
                            placeholder="exemplu@email.com"
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                          />
                          <p className="text-gray-500 text-xs mt-1">
                            Vei primi confirmarea comenzii pe acest email
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Telefon *
                          </label>
                          <input
                            type="tel"
                            value={telefonClient}
                            onChange={(e) => setTelefonClient(e.target.value)}
                            placeholder="0712345678"
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Ora ridicării *
                          </label>
                          <input
                            type="time"
                            value={oraRidicare}
                            onChange={(e) => setOraRidicare(e.target.value)}
                            required
                            min="10:00"
                            max="22:00"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-gray-500 text-xs mt-1">
                            Program: 10:00 - 22:00
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Notă (opțional)
                          </label>
                          <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            placeholder="Ex: Fără ceapă la pizza..."
                            rows={3}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 resize-none"
                          />
                        </div>
                        
                        {/* SUMAR PREȚ */}
                        <div className="border-t border-zinc-700 pt-4 mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="text-white">{totalPrice.toFixed(2)} lei</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400">Ridicare personală</span>
                            <span className="text-green-500">GRATUIT</span>
                          </div>
                          <div className="flex justify-between items-center text-xl font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-orange-500">{totalPrice.toFixed(2)} lei</span>
                          </div>
                        </div>
                        
                        {/* BUTON PLASARE COMANDĂ */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl transition text-lg mt-4"
                        >
                          {loading ? "Se procesează..." : "🛒 Plasează comanda"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* MODAL FEEDBACK PRODUS */}
        {feedbackProdus && (
          <FeedbackProdusModal
            produsId={feedbackProdus.id}
            produsNume={feedbackProdus.nume}
            onClose={() => setFeedbackProdus(null)}
            onSuccess={() => {
              setFeedbackProdus(null);
              fetchOrders();
            }}
            userEmail={userEmail}
          />
        )}
      </div>
    </div>
  );
};

export default CosCumparaturi;