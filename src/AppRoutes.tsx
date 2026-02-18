import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./Pagini Admin/Dashboard";
import Mancare from "./Pagini Admin/Mancare";
import Bauturi from "./Pagini Admin/Bauturi";
import Meniu from "./Pagini Client/Meniu";
import FeedbackForm from "./Pagini Client/FeedbackPage";
import FeedbackAdmin from "./Pagini Admin/Feedback";
import ContactPage from "./Pagini Client/ContactPage";
import Contact from "./Pagini Admin/Contact";
import DespreNoi from "./Pagini Client/DespreNoi";
import RezervaMasa from "./Pagini Client/RezervaMasa";
import Rezervari from "./Pagini Admin/Rezervari"; 
import Auth from "./Pagini Client/Auth";
import CosCumparaturi from "./Pagini Client/CosCumparaturi";
import Comenzi from "./Pagini Admin/Comenzi";
import ConfirmReview from "./Pagini Client/ConfirmReview";
import ModificaRezervare from "./Pagini Client/ModificaRezervari";
import ProtectedRoutes from "./Componente/ProtectedRoutes"; 

// Componentă separată pentru rute (useLocation funcționează doar în interiorul Router)
function AppRoutes() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/meniu" />} />

      <Route path="/meniu" element={<Meniu />} />
      <Route path="/feedback" element={<FeedbackForm />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/desprenoi" element={<DespreNoi />} />
      <Route path="/rezervamasa" element={<RezervaMasa />} />
      {/* key={location.key} forțează remontarea la fiecare navigare pe /auth */}
      <Route path="/auth" element={<Auth key={location.key} />} />
      <Route path="/cos" element={<CosCumparaturi />} />
      <Route path="/confirm-review" element={<ConfirmReview />} />
      <Route path="/modifica-rezervare/:id/:cod" element={<ModificaRezervare />} />

      <Route element={<ProtectedRoutes />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mancare" element={<Mancare />} />
        <Route path="/bauturi" element={<Bauturi />} />
        <Route path="/feedback-admin" element={<FeedbackAdmin />} />
        <Route path="/contact-admin" element={<Contact />} />
        <Route path="/rezervari" element={<Rezervari />} />
        <Route path="/comenzi-admin" element={<Comenzi />} />
      </Route>

      <Route path="*" element={<Navigate to="/meniu" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="bg-black min-h-screen">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;