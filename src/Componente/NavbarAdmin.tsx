import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-black text-white p-4 flex gap-4">
      <Link to="/dashboard" className="hover:text-orange-500 text-orange-500">Dashboard</Link>
      <Link to="/comenzi-admin" className="hover:text-orange-500 text-orange-500">Comenzi</Link>
      <Link to="/mancare" className="hover:text-orange-500 text-orange-500">Mancare</Link>
      <Link to="/bauturi" className="hover:text-orange-500 text-orange-500">Băuturi</Link>
      <Link to="/feedback-admin" className="hover:text-orange-500 text-orange-500">Feedback Admin</Link>
      <Link to="/contact-admin" className="hover:text-orange-500 text-orange-500">Contact</Link>
      <Link to="/rezervari" className="hover:text-orange-500 text-orange-500">Rezervări</Link>
    </nav>
  );
};

export default Navbar;
