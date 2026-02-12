import { useState, useEffect } from "react";
import { supabase } from "../SupabaseClient";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  
  // State pentru utilizator autentificat
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ nume?: string; telefon?: string } | null>(null);
  
  // State pentru tab-uri (Login sau Register)
  const [isLogin, setIsLogin] = useState(true);
  
  // State pentru formulare
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nume, setNume] = useState("");
  const [telefon, setTelefon] = useState("");
  
  // State pentru loading și erori
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ VERIFICĂ DACĂ UTILIZATORUL ESTE DEJA AUTENTIFICAT
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUser(user);
      
      // Încarcă profilul utilizatorului
      const { data: profile } = await supabase
        .from("profiles")
        .select("nume, telefon")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }
    }
    
    setLoading(false);
  };

  // ✅ FUNCȚIE LOGOUT
  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setError("Eroare la deconectare: " + error.message);
      setLoading(false);
    } else {
      setUser(null);
      setUserProfile(null);
      setSuccess("Ai fost deconectat cu succes!");
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    }
  };

  // ✅ FUNCȚIE LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError("Te rog completează toate câmpurile!");
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError(loginError.message === "Invalid login credentials" 
        ? "Email sau parolă incorectă!" 
        : loginError.message);
    } else if (data.user) {
      setSuccess("Autentificare reușită! Redirecționare...");
      setTimeout(() => navigate("/meniu"), 1500);
    }
  };

  // ✅ FUNCȚIE REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password || !confirmPassword || !nume) {
      setError("Te rog completează toate câmpurile obligatorii!");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Parolele nu coincid!");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere!");
      setLoading(false);
      return;
    }

    // Creăm contul
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Actualizăm profilul cu nume și telefon
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nume, telefon })
        .eq("id", data.user.id);

      setLoading(false);

      if (profileError) {
        console.error("Eroare actualizare profil:", profileError);
      }

      setSuccess("Cont creat cu succes! Redirecționare...");
      setTimeout(() => navigate("/meniu"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* LOGO / TITLE */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            🍽️ Restaurant
          </h1>
          <p className="text-gray-400">
            {user ? `Bună, ${userProfile?.nume || user.email}!` : (isLogin ? "Bun venit înapoi!" : "Creează-ți un cont nou")}
          </p>
        </div>

        {/* DACĂ USER-UL ESTE AUTENTIFICAT - AFIȘEAZĂ PROFILUL */}
        {user ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8">
            {/* MESAJE SUCCES/EROARE */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-900 border border-green-700 text-green-200 rounded-lg text-sm">
                ✅ {success}
              </div>
            )}

            {/* INFORMAȚII PROFIL */}
            <div className="bg-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {userProfile?.nume?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{userProfile?.nume || "Utilizator"}</h3>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>

              {userProfile?.telefon && (
                <div className="pt-4 border-t border-zinc-700">
                  <p className="text-gray-400 text-sm">📞 Telefon</p>
                  <p className="text-white font-medium">{userProfile.telefon}</p>
                </div>
              )}
            </div>

            {/* STATUS AUTENTIFICAT */}
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-xl">✅</span>
                <div>
                  <p className="text-green-400 font-semibold">Ești autentificat</p>
                  <p className="text-green-300 text-sm">Poți comanda și face rezervări</p>
                </div>
              </div>
            </div>

            {/* BUTOANE ACȚIUNI */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/meniu")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                🍽️ Mergi la Meniu
              </button>

              <button
                onClick={() => navigate("/cos")}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                🛒 Vezi Coșul
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? "Se deconectează..." : "🚪 Deconectare"}
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARE LOGIN/REGISTER - DOAR DACĂ NU E AUTENTIFICAT */
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8">
            {/* TAB-URI LOGIN / REGISTER */}
            <div className="flex gap-2 mb-6 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-md font-semibold transition ${
                isLogin
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Autentificare
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-md font-semibold transition ${
                !isLogin
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Înregistrare
            </button>
          </div>

          {/* MESAJE EROARE / SUCCES */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-900 border border-green-700 text-green-200 rounded-lg text-sm">
              ✅ {success}
            </div>
          )}

          {/* FORMULAR LOGIN */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplu@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Parolă
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? "Se autentifică..." : "Autentificare"}
              </button>
            </form>
          ) : (
            /* FORMULAR REGISTER */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nume complet *
                </label>
                <input
                  type="text"
                  value={nume}
                  onChange={(e) => setNume(e.target.value)}
                  placeholder="Ion Popescu"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Telefon (opțional)
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="0712345678"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplu@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Parolă *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minim 6 caractere"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirmă parola *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Rescrie parola"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? "Se creează contul..." : "Creează cont"}
              </button>
            </form>
          )}

          {/* LINK CĂTRE MENIU (GUEST) */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/meniu")}
              className="text-gray-400 hover:text-orange-500 text-sm font-medium transition"
            >
              Continuă fără cont (vizitator) →
            </button>
          </div>
        </div>
        )}

        {/* FOOTER */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Creând un cont, accepți termenii și condițiile noastre
        </p>
      </div>
    </div>
  );
};

export default Auth;