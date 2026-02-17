import NavbarClient from "../Componente/NavbarClient";
import { useNavigate } from "react-router-dom";

const DespreNoi = () => {
  const navigate = useNavigate();

  const handleSetFilter = (filter: "mancare" | "bauturi" | null) => {
    if (filter === null) {
      navigate("/meniu");
    } else {
      navigate(`/meniu?filter=${filter}`);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* NAVBAR */}
      <NavbarClient filter={null} setFilter={handleSetFilter} />

      <div className="max-w-6xl mx-auto p-4 space-y-10">
        {/* DESPRE NOI */}
        <section className="bg-zinc-900 rounded-xl shadow-md p-6 border border-zinc-800">
          <h1 className="text-3xl font-extrabold text-white mb-4 text-center">
            Despre noi
          </h1>

          <p className="text-gray-300 leading-relaxed text-center max-w-3xl mx-auto">
            Restaurantul nostru a fost creat din pasiunea pentru mâncarea de
            calitate și dorința de a oferi clienților o experiență autentică.
            Folosim ingrediente proaspete și rețete atent alese pentru a
            transforma fiecare masă într-un moment special.
          </p>
        </section>

        {/* CONCEPT & VALORI */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-xl shadow-md p-6 text-center border border-zinc-800">
            <h3 className="text-xl font-bold text-orange-500 mb-2">
              Calitate
            </h3>
            <p className="text-gray-400">
              Punem accent pe ingrediente proaspete și preparate gătite cu grijă.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-xl shadow-md p-6 text-center border border-zinc-800">
            <h3 className="text-xl font-bold text-orange-500 mb-2">
              Experiență
            </h3>
            <p className="text-gray-400">
              Dorim ca fiecare client să se simtă bine primit și apreciat.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-xl shadow-md p-6 text-center border border-zinc-800">
            <h3 className="text-xl font-bold text-orange-500 mb-2">
              Pasiune
            </h3>
            <p className="text-gray-400">
              Gătim din pasiune și respect pentru bucătăria autentică.
            </p>
          </div>
        </section>

        {/* PROGRAM + CONTACT + MAPS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* INFO */}
          <div className="bg-zinc-900 rounded-xl shadow-md p-6 space-y-6 border border-zinc-800">
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-4">
                Program Restaurant
              </h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between">
                  <span>Luni - Vineri</span>
                  <span className="font-semibold">10:00 – 22:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Sâmbătă</span>
                  <span className="font-semibold">12:00 – 23:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Duminică</span>
                  <span className="font-semibold">12:00 – 21:00</span>
                </li>
              </ul>
            </div>

            <div className="text-gray-300 text-sm">
              <p>📍 Str. Exemplu nr. 10, București</p>
              <p className="mt-1">📞 +40 700 000 000</p>
              <p className="mt-1">✉️ contact@restaurant.ro</p>
            </div>
          </div>

          {/* GOOGLE MAPS */}
          <div className="bg-zinc-900 rounded-xl shadow-md overflow-hidden border border-zinc-800">
            <iframe
              title="Locatie Restaurant"
              src="https://www.google.com/maps?q=Timisoara&output=embed"
              className="w-full h-full min-h-87.5 border-0"
              loading="lazy"
            ></iframe>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DespreNoi;