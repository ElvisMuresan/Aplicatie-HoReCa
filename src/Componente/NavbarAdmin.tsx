import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-black text-white p-4 flex gap-4">
      <Link to="/dashboard" className="hover:text-purple-600 text-purple-600">Dashboard</Link>
      <Link to="/comenzi-admin" className="hover:text-purple-600 text-purple-600">Comenzi</Link>
      <Link to="/mancare" className="hover:text-purple-600 text-purple-600">Mancare</Link>
      <Link to="/bauturi" className="hover:text-purple-600 text-purple-600">Băuturi</Link>
      <Link to="/feedback-admin" className="hover:text-purple-600 text-purple-600">Feedback Admin</Link>
      <Link to="/contact-admin" className="hover:text-purple-600 text-purple-600">Contact</Link>
      <Link to="/rezervari" className="hover:text-purple-600 text-purple-600">Rezervări</Link>
    </nav>
  );
};

export default Navbar;
