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
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = () => {
    setMenuOpen(false);
    if (location.pathname !== "/meniu") {
      navigate("/meniu");
    } else {
      setFilter(null);
    }
  };

  const handleFilterClick = (filterValue: "mancare" | "bauturi") => {
    setMenuOpen(false);
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
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-500">🍽️ Gatit la foc mic</h1>

        {/* DESKTOP - toate linkurile pe o linie */}
        <div className="hidden xl:flex gap-3 items-center">
          {/* MENIU CU DROPDOWN */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleMenuClick}
              className="text-xl font-semibold text-orange-500 transition whitespace-nowrap"
            >
              Meniu
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-44 bg-black rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <ul className="py-2 text-sm">
                <li>
                  <button
                    onClick={() => handleFilterClick("mancare")}
                    className={`w-full text-left px-4 py-2 hover:bg-zinc-800 ${filter === "mancare" ? "text-orange-500 font-semibold" : "text-orange-500"}`}
                  >
                    Meniu Mâncare
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleFilterClick("bauturi")}
                    className={`w-full text-left px-4 py-2 hover:bg-zinc-800 ${filter === "bauturi" ? "text-orange-500 font-semibold" : "text-orange-500"}`}
                  >
                    Meniu Băuturi
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <Link to="/feedback" className="text-xl font-semibold text-orange-500 transition whitespace-nowrap">Feedback</Link>
          <Link to="/contact" className="text-xl font-semibold text-orange-500 transition whitespace-nowrap">Contact</Link>
          <Link to="/rezervamasa" className="text-xl font-semibold text-orange-500 transition whitespace-nowrap">Rezervări</Link>
          <Link to="/desprenoi" className="text-xl font-semibold text-orange-500 transition whitespace-nowrap">Despre Noi</Link>

          <Link to="/cos" className="relative text-xl font-semibold text-orange-500 transition flex items-center gap-1 whitespace-nowrap">
            🛒 Coș
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          <Link to="/auth" className="text-xl font-semibold text-orange-500 transition whitespace-nowrap">
            {isAuthenticated ? "👤 Contul meu" : "Autentificare"}
          </Link>
        </div>

        {/* MOBIL - hamburger + cos */}
        <div className="flex xl:hidden items-center gap-3">
          <Link to="/cos" className="relative text-xl font-semibold text-orange-500 flex items-center gap-1">
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-orange-500 text-3xl font-bold focus:outline-none"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBIL MENU DROPDOWN */}
      {menuOpen && (
        <div className="xl:hidden bg-zinc-900 border-t border-zinc-800 px-4 py-4 flex flex-col gap-4">
          <div>
            <button onClick={handleMenuClick} className="text-xl font-semibold text-orange-500 w-full text-left">
              Meniu
            </button>
            <div className="ml-4 mt-2 flex flex-col gap-2">
              <button onClick={() => handleFilterClick("mancare")} className="text-left text-orange-400 text-base">→ Mâncare</button>
              <button onClick={() => handleFilterClick("bauturi")} className="text-left text-orange-400 text-base">→ Băuturi</button>
            </div>
          </div>
          <Link to="/feedback" onClick={() => setMenuOpen(false)} className="text-xl font-semibold text-orange-500">Feedback</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)} className="text-xl font-semibold text-orange-500">Contact</Link>
          <Link to="/rezervamasa" onClick={() => setMenuOpen(false)} className="text-xl font-semibold text-orange-500">Rezervări</Link>
          <Link to="/desprenoi" onClick={() => setMenuOpen(false)} className="text-xl font-semibold text-orange-500">Despre Noi</Link>
          <Link to="/auth" onClick={() => setMenuOpen(false)} className="text-xl font-semibold text-orange-500">
            {isAuthenticated ? "👤 Contul meu" : "Autentificare"}
          </Link>
        </div>
      )}
    </div>
  );
};

export default NavbarClient;