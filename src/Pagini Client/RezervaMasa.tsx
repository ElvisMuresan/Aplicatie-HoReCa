import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarClient from "../Componente/NavbarClient";
import { supabase } from "../SupabaseClient";

const RezervaMasa = () => {
  const navigate = useNavigate();
  const handleSetFilter = (filter: "mancare" | "bauturi" | null) => {
    if (filter === null) {
      navigate("/meniu");
    } else {
      navigate(`/meniu?filter=${filter}`);
    }
  };

  // 🔹 state pentru formular
  const [nume, setNume] = useState("");
  const [email, setEmail] = useState("");
  const [dataRezervare, setDataRezervare] = useState("");
  const [oraRezervare, setOraRezervare] = useState("");
  const [persoane, setPersoane] = useState(1);
  const [observatii, setObservatii] = useState("");

  // 🔹 funcție trimitere rezervare
  const trimiteRezervare = async () => {
    if (!nume || !email || !dataRezervare || !oraRezervare || !persoane) {
      alert("Te rog completează toate câmpurile obligatorii!");
      return;
    }

    // validare data >= azi
    const azi = new Date().toISOString().split("T")[0];
    if (dataRezervare < azi) {
      alert("Data rezervării nu poate fi în trecut!");
      return;
    }

    const { error } = await supabase.from("rezervari").insert([
      {
        nume,
        email,
        data: dataRezervare,
        ora: oraRezervare,
        persoane,
        observatii,
        status: "pending", // rezervare nouă
      },
    ]);

    if (error) {
      console.error(error);
      alert("A apărut o eroare la trimiterea rezervării.");
    } else {
      alert(
        "Rezervarea ta a fost trimisă cu succes! Vei primi confirmarea prin email."
      );
      setNume("");
      setEmail("");
      setDataRezervare("");
      setOraRezervare("");
      setPersoane(1);
      setObservatii("");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* NAVBAR */}
      <NavbarClient filter={null} setFilter={handleSetFilter} />

      <div className="max-w-4xl mx-auto p-6 bg-zinc-900 rounded-xl shadow-md mt-8 border border-zinc-800">
        <h1 className="text-3xl font-extrabold text-white mb-6 text-center">
          Rezervă o masă
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Completează formularul de mai jos pentru a solicita o rezervare. Vei
          primi confirmarea prin email după ce restaurantul aprobă cererea.
        </p>

        <form className="space-y-5">
          {/* NUME */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Nume și prenume *
            </label>
            <input
              type="text"
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              placeholder="Ex: Popescu Andrei"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplu@email.com"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
            />
          </div>

          {/* DATA */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Data rezervării *
            </label>
            <input
              type="date"
              value={dataRezervare}
              onChange={(e) => setDataRezervare(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* ORA */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Ora rezervării *
            </label>
            <input
              type="time"
              value={oraRezervare}
              onChange={(e) => setOraRezervare(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* PERSOANE */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Număr persoane *
            </label>
            <input
              type="number"
              min={1}
              value={persoane}
              onChange={(e) => setPersoane(Number(e.target.value))}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* OBSERVATII */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Observații
            </label>
            <textarea
              value={observatii}
              onChange={(e) => setObservatii(e.target.value)}
              rows={3}
              placeholder="Ex: masă la geam, aniversare..."
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder-gray-500"
            />
          </div>

          {/* BUTON */}
          <button
            type="button"
            onClick={trimiteRezervare}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition w-full"
          >
            Trimite cererea
          </button>
        </form>
      </div>
    </div>
  );
};

export default RezervaMasa;