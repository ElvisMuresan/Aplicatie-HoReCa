import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../SupabaseClient";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/meniu-client");
  };

  return (
    <nav className="bg-black text-white p-4 flex justify-center items-center gap-4">
      <Link to="/dashboard" className="hover:text-orange-500 text-orange-500">Dashboard</Link>
      <Link to="/comenzi-admin" className="hover:text-orange-500 text-orange-500">Comenzi</Link>
      <Link to="/mancare" className="hover:text-orange-500 text-orange-500">Mancare</Link>
      <Link to="/bauturi" className="hover:text-orange-500 text-orange-500">Băuturi</Link>
      <Link to="/feedback-admin" className="hover:text-orange-500 text-orange-500">Feedback Admin</Link>
      <Link to="/contact-admin" className="hover:text-orange-500 text-orange-500">Contact</Link>
      <Link to="/rezervari" className="hover:text-orange-500 text-orange-500">Rezervări</Link>
      <button
        onClick={handleLogout}
        className="hover:text-orange-500 text-orange-500 font-semibold px-4 py-2 rounded-lg transition border-none bg-transparent focus:outline-none"
        style={{ minWidth: 'auto', height: 'auto' }}
      >
        Deconectare
      </button>
    </nav>
  );
};

export default Navbar;
