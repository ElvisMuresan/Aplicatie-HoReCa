import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarClient from "../Componente/NavbarClient";
import { supabase } from "../SupabaseClient";

// ─── Custom Time Picker ────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 13 }, (_, i) => i + 10); // 10-22
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const pad = (n: number) => String(n).padStart(2, "0");

interface TimePicker {
  ore: number;
  minute: number;
  onConfirm: (h: number, m: number) => void;
  onClose: () => void;
}

const TimePickerDropdown = ({ ore, minute, onConfirm, onClose }: TimePicker) => {
  const [h, setH] = useState(ore);
  const [m, setM] = useState(minute);
  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute z-50 top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 w-60">
      <div className="flex gap-4">
        {/* ORE */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Ore</span>
          <div
            ref={hRef}
            className="h-40 overflow-y-auto scrollbar-none flex flex-col items-center gap-1 w-full"
            style={{ scrollbarWidth: "none" }}
          >
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => setH(hour)}
                className={`w-full text-center py-1 rounded-lg text-sm font-semibold transition-all duration-100
                  ${h === hour
                    ? "bg-orange-500 text-white scale-105"
                    : "text-gray-300 hover:bg-zinc-700 hover:text-white active:bg-zinc-600 active:scale-95"
                  }`}
              >
                {pad(hour)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center pb-2 text-gray-500 text-2xl font-bold">:</div>

        {/* MINUTE */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Minute</span>
          <div
            ref={mRef}
            className="h-40 overflow-y-auto scrollbar-none flex flex-col items-center gap-1 w-full"
            style={{ scrollbarWidth: "none" }}
          >
            {MINUTES.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setM(min)}
                className={`w-full text-center py-1 rounded-lg text-sm font-semibold transition-all duration-100
                  ${m === min
                    ? "bg-orange-500 text-white scale-105"
                    : "text-gray-300 hover:bg-zinc-700 hover:text-white active:bg-zinc-600 active:scale-95"
                  }`}
              >
                {pad(min)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 active:scale-95 text-white text-sm font-semibold transition-all"
        >
          Anulează
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(h, m); onClose(); }}
          className="flex-1 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 active:scale-95 text-white text-sm font-semibold transition-all"
        >
          Confirmă
        </button>
      </div>
    </div>
  );
};
// ──────────────────────────────────────────────────────────────────────────────

const RezervaMasa = () => {
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
  const [dataRezervare, setDataRezervare] = useState("");
  const [ore, setOre] = useState(12);
  const [minute, setMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [persoane, setPersoane] = useState(1);
  const [observatii, setObservatii] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const oraRezervare = `${pad(ore)}:${pad(minute)}`;

  const trimiteRezervare = async () => {
    if (!nume || !email || !dataRezervare || !persoane) {
      alert("Te rog completează toate câmpurile obligatorii!");
      return;
    }

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
        status: "pending",
      },
    ]);

    if (error) {
      console.error(error);
      alert("A apărut o eroare la trimiterea rezervării.");
    } else {
      setNume("");
      setEmail("");
      setDataRezervare("");
      setOre(12);
      setMinute(0);
      setPersoane(1);
      setObservatii("");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/meniu");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <NavbarClient filter={null} setFilter={handleSetFilter} />

      {/* POPUP SUCCES */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-green-600 rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4 animate-pulse">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Mulțumim!</h2>
            <p className="text-gray-300">Rezervarea ta a fost trimisă cu succes. Vei primi confirmarea prin email.</p>
          </div>
        </div>
      )}

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

          {/* ORA – custom picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Ora rezervării *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTimePicker((v) => !v)}
                className="w-full flex items-center justify-between rounded-lg bg-zinc-800 border border-zinc-700 text-white px-4 py-2 hover:border-orange-500 active:scale-[0.98] active:bg-zinc-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <span className="text-lg  tracking-widest">
                  <span className="text-white">{pad(ore)}</span>
                  <span className="text-gray-500 mx-1">:</span>
                  <span className="text-white">{pad(minute)}</span>
                </span>
                {/* Ceas icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
              </button>

              {showTimePicker && (
                <TimePickerDropdown
                  ore={ore}
                  minute={minute}
                  onConfirm={(h, m) => { setOre(h); setMinute(m); }}
                  onClose={() => setShowTimePicker(false)}
                />
              )}
            </div>
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

          {/* BUTON SUBMIT */}
          <button
            type="button"
            onClick={trimiteRezervare}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 active:scale-[0.98] text-white font-semibold px-6 py-2 rounded-lg transition-all duration-150 w-full"
          >
            Trimite cererea
          </button>
        </form>
      </div>
    </div>
  );
};

export default RezervaMasa;