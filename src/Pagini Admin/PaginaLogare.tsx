import { useState } from "react";
import { supabase } from "../SupabaseClient";
import { useNavigate } from "react-router-dom";

const PaginaLogare = () => {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setEroare("");

    try {
      // 1️⃣ Logare cu Supabase Auth
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: parola,
      });

      if (loginError || !loginData.user) {
        setEroare("Email sau parola incorectă.");
        setLoading(false);
        return;
      }

      const userId = loginData.user.id;

      // 2️⃣ Verificare în tabela admins
      const { data: admins, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("id", userId)
        .single();

      if (adminError || !admins) {
        setEroare("Nu aveți permisiunea de admin.");
        await supabase.auth.signOut(); // scoatem sesiunile pentru siguranță
        setLoading(false);
        return;
      }

      // 3️⃣ Dacă e admin, redirecționăm către dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      setEroare("A apărut o eroare la autentificare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-liner-to-br from-orange-100 via-yellow-50 to-white">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-orange-600 mb-6">
          Logare Admin
        </h1>

        {eroare && <div className="mb-4 text-red-500 text-center">{eroare}</div>}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@restaurant.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Parolă</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={parola}
            onChange={(e) => setParola(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          {loading ? "Se conectează..." : "Conectează-te"}
        </button>
      </div>
    </div>
  );
};

export default PaginaLogare;
