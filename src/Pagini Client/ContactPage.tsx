import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarClient from "../Componente/NavbarClient";
import { supabase } from "../SupabaseClient"; // 🔹 adăugat import Supabase

const Contact = () => {
  const navigate = useNavigate();
  const handleSetFilter = (filter: "mancare" | "bauturi" | null) => {
    if (filter === null) {
      navigate("/meniu");
    } else {
      navigate(`/meniu?filter=${filter}`);
    }
  };
  const [nume, setNume] = useState("");
  const [email, setEmail] = useState("");
  const [mesaj, setMesaj] = useState("");

  // 🔹 funcție de trimitere mesaj către Supabase
  const trimiteMesaj = async () => {
    if (!nume || !email || !mesaj) {
      alert("Te rog completează toate câmpurile!");
      return;
    }

    const { error } = await supabase.from("contact").insert([
      {
        nume_prenume: nume,
        email,
        mesaj,
      },
    ]);

    if (error) {
      console.error(error);
      alert("A apărut o eroare la trimiterea mesajului.");
    } else {
      alert("Mesaj trimis cu succes!");
      setNume("");
      setEmail("");
      setMesaj("");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* NAVBAR */}
     <NavbarClient filter={null} setFilter={handleSetFilter} />

      <div className="max-w-3xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
        {/* FORMULAR CONTACT */}
        <div className="md:col-span-2 bg-zinc-900 rounded-xl shadow-md p-6 border border-zinc-800">
          <h1 className="text-2xl text-center font-extrabold text-white mb-6">
            Contact 
          </h1>

          <p className="text-gray-400 mb-6">
            Dacă doriți să ne contactați pentru colaborări, evenimente sau alte
            informații, completați formularul de mai jos.
          </p>

          <form className="space-y-5">
            {/* NUME */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Nume și prenume
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
                Email de contact
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplu@email.com"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
              />
            </div>

            {/* MESAJ */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Mesaj
              </label>
              <textarea
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                placeholder="Scrieți mesajul dumneavoastră aici..."
                rows={5}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder-gray-500"
              />
            </div>

            {/* BUTON */}
            <button
              type="button"
              onClick={trimiteMesaj} // 🔹 legat de funcția de trimitere
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition"
            >
              Trimite mesajul
            </button>
          </form>
        </div>

       
      </div>
    </div>
  );
};

export default Contact;