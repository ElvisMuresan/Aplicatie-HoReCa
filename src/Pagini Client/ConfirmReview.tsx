import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../SupabaseClient";

const ConfirmReview = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmReview = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Link invalid - token lipsă.");
        return;
      }

      try {
        console.log("🔑 Token pentru confirmare:", token);
        
        // Apelăm funcția de confirmare din Supabase
        const { data, error } = await supabase.rpc("confirm_review", {
          p_token: token,
        });

        console.log("📡 Răspuns de la confirm_review:", data);
        console.log("❌ Eroare (dacă există):", error);

        if (error) {
          console.error("❌ Eroare la confirmare:", error);
          setStatus("error");
          setMessage("A apărut o eroare la confirmarea recenziei.");
          return;
        }

        if (data?.success) {
          console.log("✅ Confirmare reușită!");
          console.log("📊 Produs ID:", data.produs_id);
          console.log("⭐ Rating nou:", data.new_rating);
          
          setStatus("success");
          setMessage(data.message || "Recenzia ta a fost confirmată cu succes!");
          
          // Verifică rating-ul în DB după 1 secundă
          setTimeout(async () => {
            const { data: menuData } = await supabase
              .from("menu")
              .select("id, nume, rating_mediu")
              .eq("id", data.produs_id)
              .single();
            
            console.log("🔍 Verificare rating în DB după confirmare:", menuData);
          }, 1000);
        } else {
          console.warn("⚠️ Confirmare failed:", data);
          setStatus("error");
          setMessage(data?.message || "Token invalid sau recenzie deja confirmată.");
        }
      } catch (e) {
        console.error("💥 Exception:", e);
        setStatus("error");
        setMessage("A apărut o eroare neașteptată.");
      }
    };

    confirmReview();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
        {status === "loading" && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Se confirmă recenzia...
            </h1>
            <p className="text-gray-400">Te rog așteaptă un moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">
              Recenzie confirmată!
            </h1>
            <p className="text-gray-300 mb-6">{message}</p>
            <p className="text-gray-400 text-sm mb-6">
              Mulțumim pentru feedback-ul tău! Recenzia ta a fost publicată și va ajuta alți clienți.
            </p>
            <Link
              to="/meniu"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg transition"
            >
              🍽️ Înapoi la Meniu
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Eroare la confirmare
            </h1>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">
                Posibile cauze:
              </p>
              <ul className="text-gray-400 text-sm text-left list-disc list-inside">
                <li>Link-ul a expirat sau a fost deja folosit</li>
                <li>Recenzia a fost deja confirmată anterior</li>
                <li>Link-ul a fost copiat incorect</li>
              </ul>
            </div>
            <div className="mt-6">
              <Link
                to="/meniu"
                className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                🍽️ Înapoi la Meniu
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmReview;
