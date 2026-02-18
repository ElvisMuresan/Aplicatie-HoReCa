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
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Citește sesiunea curentă — onAuthStateChange trimite INITIAL_SESSION
  // imediat din localStorage (fără call de rețea) la prima montare
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          supabase
            .from("profiles")
            .select("nume, telefon")
            .eq("id", session.user.id)
            .maybeSingle()
            .then(({ data: profile }) => {
              if (profile) setUserProfile(profile);
            });
        } else {
          setUser(null);
          setUserProfile(null);
        }
        // Deblocăm UI după primul eveniment (INITIAL_SESSION)
        setSessionChecked(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      setLoading(false);
      navigate("/meniu");
    }
  };

  // ✅ FUNCȚIE LOGIN CU GOOGLE
  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/meniu`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      setError("Eroare la autentificarea cu Google: " + error.message);
      setLoading(false);
    }
    // Nu setăm loading false aici pentru că utilizatorul va fi redirecționat
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

    if (loginError) {
      setError(loginError.message === "Invalid login credentials" 
        ? "Email sau parolă incorectă!" 
        : loginError.message);
      setLoading(false);
      return;
    }
    
    if (data.user) {
      // Verifică dacă este admin
      const { data: adminData } = await supabase
        .from("admins")
        .select("id")
        .eq("id", data.user.id)
        .single();

      setLoading(false);

      if (adminData) {
        setSuccess("Autentificare admin reușită! Redirecționare...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setSuccess("Autentificare reușită! Redirecționare...");
        setTimeout(() => navigate("/meniu"), 1500);
      }
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

    // Creăm contul cu metadata pentru nume și telefon
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nume: nume,
          telefon: telefon,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Folosim upsert pentru a crea sau actualiza profilul cu nume și telefon
      // Specificăm onConflict pentru a rezolva conflictul pe coloana 'id'
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { 
            id: data.user.id, 
            email: data.user.email,
            nume, 
            telefon,
            rol: 'client'
          },
          { 
            onConflict: 'id',
            ignoreDuplicates: false 
          }
        );

      if (profileError) {
        console.error("Eroare upsert profil:", profileError);
        
        // Încercăm update direct dacă upsert a eșuat
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ nume, telefon })
          .eq("id", data.user.id);
          
        if (updateError) {
          console.error("Eroare update profil:", updateError);
        }
      }

      setLoading(false);

      setSuccess("Cont creat cu succes! Redirecționare...");
      setTimeout(() => navigate("/meniu"), 2000);
    }
  };

  // Spinner până când sesiunea e verificată
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-orange-500 text-xl animate-pulse">🍽️ Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* LOGO / TITLE */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            🍽️ Gatit la foc mic
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

            {/* MESAJ EROARE */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            {/* FORMULAR LOGIN */}
            {isLogin ? (
              <>
                {/* BUTON GOOGLE LOGIN */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-3 mb-6 border border-gray-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {loading ? "Se conectează..." : "Continuă cu Google"}
                </button>

                {/* SEPARATOR */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-zinc-900 text-gray-400">sau cu email</span>
                  </div>
                </div>

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
                      placeholder="Parolă"
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
              </>
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
                    placeholder="Parolă (minim 6 caractere)"
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
                    placeholder="Confirmă parola"
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

        {/* MESAJ SUCCES — afișat sub termeni și condiții */}
        {success && (
          <div className="mt-3 p-3 bg-green-900 border border-green-700 text-green-200 rounded-lg text-sm text-center">
            ✅ {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;