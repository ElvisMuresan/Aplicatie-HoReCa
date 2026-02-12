import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import { supabase } from "../SupabaseClient";

type NavbarClientProps = {
  filter: "mancare" | "bauturi" | null;
  setFilter: (filter: "mancare" | "bauturi" | null) => void;
};

const NavbarClient: React.FC<NavbarClientProps> = ({ filter, setFilter }) => {
  const { totalItems } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="bg-black shadow sticky top-0 z-10">
      <div className="max-w-5xl mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-purple-600 ">🍽️ Meniul nostru</h1>

        <div className="flex gap-4 items-center">
          {/* MENIU STATIC */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="text-sm font-semibold text-orange-500 transition"
            >
              Meniu
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-44 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <ul className="py-2 text-sm">
                <li>
                  <button
                    onClick={() => setFilter("mancare")}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100
                      ${
                        filter === "mancare"
                          ? "text-purple-600 font-semibold"
                          : "text-purple-600"
                      }
                    `}
                  >
                    Meniu Mâncare
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => setFilter("bauturi")}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100
                      ${
                        filter === "bauturi"
                          ? "text-purple-600 font-semibold"
                          : "text-purple-600"
                      }
                    `}
                  >
                    Meniu Băuturi
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* FEEDBACK */}
          <Link
            to="/feedback"
            className="text-sm font-semibold text-purple-600 hover:text-purple-600 transition"
          >
            Feedback
          </Link>

          {/* ✅ CONTACT */}
          <Link
            to="/contact"
            className="text-sm font-semibold text-purple-600 hover:text-purple-600 transition"
          >
            Contact
          </Link>  
           <Link
          to="/rezervamasa"
           className="text-sm font-semibold text-purple-600 hover:text-purple-600 transition">
         Rezervari
           </Link>      
          <Link
          to="/desprenoi"
           className="text-sm font-semibold text-purple-600 hover:text-purple-600 transition">
          Despre Noi
           </Link>

             {/* Coș de cumpărături */}
             <Link
               to="/cos"
               className="relative text-sm font-semibold text-purple-600 hover:text-purple-600 transition flex items-center gap-1"
             >
               🛒 Coș
               {totalItems > 0 && (
                 <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                   {totalItems > 9 ? "9+" : totalItems}
                 </span>
               )}
             </Link>

             {/* Autentificare / Cont */}
             <Link
               to="/auth"
               className="text-sm font-semibold text-purple-600 hover:text-purple-600 transition"
             >
               {isAuthenticated ? "👤 Contul meu" : "Autentificare"}
             </Link>
        </div>
      </div>
    </div>
  );
};

export default NavbarClient;
