import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import { supabase } from "../SupabaseClient";

type NavbarClientProps = {
  filter: "mancare" | "bauturi" | null;
  setFilter: (filter: "mancare" | "bauturi" | null) => void;
};

const NavbarClient: React.FC<NavbarClientProps> = ({ filter, setFilter }) => {
  const { totalItems } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = () => {
    if (location.pathname !== "/meniu") {
      navigate("/meniu");
    } else {
      setFilter(null);
    }
  };

  const handleFilterClick = (filterValue: "mancare" | "bauturi") => {
    if (location.pathname !== "/meniu") {
      navigate("/meniu");
    }
    setFilter(filterValue);
  };

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
        <h1 className="text-2xl font-bold text-orange-500 ">🍽️ Gatit la foc mic</h1>

        <div className="flex gap-4 items-center">
          {/* MENIU STATIC */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleMenuClick}
              className="text-sm font-semibold text-orange-500 transition"
            >
              Meniu
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-44 bg-black rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <ul className="py-2 text-sm">
                <li>
                  <button
                    onClick={() => handleFilterClick("mancare")}
                    className={`w-full text-left px-4 py-2 hover:bg-zinc-800
                      ${
                        filter === "mancare"
                          ? "text-orange-500 font-semibold"
                          : "text-orange-500"
                      }
                    `}
                  >
                    Meniu Mâncare
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleFilterClick("bauturi")}
                    className={`w-full text-left px-4 py-2 hover:bg-zinc-800
                      ${
                        filter === "bauturi"
                          ? "text-orange-500 font-semibold"
                          : "text-orange-500"
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
            className="text-sm font-semibold text-orange-500 hover:text-orange-500 transition"
          >
            Feedback
          </Link>

          {/* ✅ CONTACT */}
          <Link
            to="/contact"
            className="text-sm font-semibold text-orange-500 hover:text-orange-500 transition"
          >
            Contact
          </Link>  
           <Link
          to="/rezervamasa"
           className="text-sm font-semibold text-orange-500 hover:text-orange-500 transition">
         Rezervari
           </Link>      
          <Link
          to="/desprenoi"
           className="text-sm font-semibold text-orange-500 hover:text-orange-500 transition">
          Despre Noi
           </Link>

             {/* Coș de cumpărături */}
             <Link
               to="/cos"
               className="relative text-sm font-semibold text-orange-500 hover:text-orange-500 transition flex items-center gap-1"
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
               className="text-sm font-semibold text-orange-500 hover:text-orange-500 transition"
             >
               {isAuthenticated ? "👤 Contul meu" : "Autentificare"}
             </Link>
        </div>
      </div>
    </div>
  );
};

export default NavbarClient;
