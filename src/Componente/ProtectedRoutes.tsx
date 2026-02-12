// src/Componente/ProtectedRoutes.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../SupabaseClient";

const ProtectedRoutes = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Nu e logat → nu poate accesa admin
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Verificăm dacă este admin în tabela admins
      const { data: adminData, error } = await supabase
        .from("admins")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (error || !adminData) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) return <p>Se încarcă...</p>;

  // Dacă nu e admin → redirect imediat
  if (!isAdmin) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoutes;
