import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import NavbarAdmin from "../Componente/NavbarAdmin";

type Rezervare = {
  id: number;
  nume: string;
  email: string;
  data: string;
  ora: string;
  persoane: number;
  observatii?: string | null;
  status: string;
  masa?: number | null;
  created_at: string;
  cod_rezervare?: string | null;
  telefon?: string | null;
};

const AdminRezervari = () => {
  const [rezervari, setRezervari] = useState<Rezervare[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch rezervari pending
  const fetchRezervari = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rezervari")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Eroare la fetch rezervari:", error.message);
    } else {
      setRezervari(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRezervari();

    // notificări realtime
    const subscription = supabase
      .channel("public:rezervari")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rezervari" },
        (payload) => {
          setRezervari((prev) => [...prev, payload.new as Rezervare]);
          alert("Ai o rezervare nouă!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  //aceptare rezervare
 const acceptaRezervare = async (rezervare: Rezervare) => {
  const masaInput = prompt("Introduceți numărul mesei pentru rezervare:");
  if (!masaInput) return;

  const masa = parseInt(masaInput);
  if (isNaN(masa) || masa <= 0) {
    alert("Număr de masă invalid!");
    return;
  }

  try {
    // 1. Actualizează rezervarea și primește codul înapoi
    const { data: updatedRezervare, error: updateError } = await supabase
      .from("rezervari")
      .update({ status: "accepted", masa })
      .eq("id", rezervare.id)
      .select('*')
      .single();

    if (updateError) {
      console.error("Eroare la update rezervare:", updateError);
      alert("Eroare la salvarea rezervării: " + updateError.message);
      return;
    }

    console.log('✅ Rezervare actualizată:', updatedRezervare);
    console.log('🔑 Cod rezervare:', updatedRezervare?.cod_rezervare);

    // Verifică dacă codul există
    if (!updatedRezervare?.cod_rezervare) {
      console.error('❌ EROARE: cod_rezervare lipsește din baza de date!');
      alert('Rezervarea a fost acceptată, dar codul de rezervare nu a fost generat. Verifică trigger-ul SQL.');
      setRezervari(rezervari.filter((r) => r.id !== rezervare.id));
      return;
    }

    // 2. Construiește payload-ul CORECT
    const emailPayload = {
      email: updatedRezervare.email,
      nume: updatedRezervare.nume,
      data: updatedRezervare.data,
      ora: updatedRezervare.ora,
      persoane: updatedRezervare.persoane,
      masa: updatedRezervare.masa,
      cod_rezervare: updatedRezervare.cod_rezervare,  // ✅ Esențial!
      telefon: updatedRezervare.telefon || '',
      observatii: updatedRezervare.observatii || '',
      reservation_id: updatedRezervare.id.toString()  // ✅ Esențial!
    };

    console.log('📧 Trimitere email cu payload COMPLET:', emailPayload);
    console.log('🔍 Verificare cod_rezervare în payload:', emailPayload.cod_rezervare);
    console.log('🔍 Verificare reservation_id în payload:', emailPayload.reservation_id);

    // 3. Trimite email
    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      'send-reservation-email',
      { 
        body: emailPayload
      }
    );

    if (emailError) {
      console.error("❌ Eroare la trimiterea emailului:", emailError);
      console.error("❌ Detalii eroare:", JSON.stringify(emailError, null, 2));
      alert("Rezervarea a fost acceptată, dar emailul nu a putut fi trimis.\n" + emailError.message);
    } else {
      console.log("✅ Email trimis cu succes!", emailData);
      alert(`Rezervarea pentru ${updatedRezervare.nume} a fost acceptată și emailul a fost trimis!`);
    }

    // 4. Actualizare UI
    setRezervari(rezervari.filter((r) => r.id !== rezervare.id));

  } catch (err) {
    console.error("❌ Eroare generală:", err);
    alert("Eroare la procesarea rezervării: " + (err as Error).message);
  }
};

  // respingere rezervare
  const respingeRezervare = async (rezervare: Rezervare) => {
    const confirmRespingere = confirm(
      `Sigur vrei să respingi rezervarea pentru ${rezervare.nume}?`
    );
    if (!confirmRespingere) return;

    const { error } = await supabase
      .from("rezervari")
      .update({ status: "rejected" })
      .eq("id", rezervare.id);

    if (error) {
      console.error("Eroare la respingere rezervare:", error.message);
      alert("Eroare la respingerea rezervării: " + error.message);
      return;
    }

    // actualizare UI
    setRezervari(rezervari.filter((r) => r.id !== rezervare.id));
    alert(
      `Rezervarea pentru ${rezervare.nume} a fost respinsă. Clientul va fi notificat prin email.`
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <NavbarAdmin />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-extrabold text-white mb-8 border-b border-orange-500 pb-4">
          📅 Rezervări Pending
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-orange-500 font-semibold text-lg animate-pulse">
              Se încarcă rezervările...
            </p>
          </div>
        ) : rezervari.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Nu există rezervări noi în așteptare.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rezervari.map((rez) => (
              <div
                key={rez.id}
                className="bg-liniar-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl hover:border-orange-500 transition-all duration-300 p-6"
              >
                {/* Header */}
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <h3 className="text-xl font-bold text-orange-500 mb-2">
                    {rez.nume}
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {rez.email}
                  </p>
                  {rez.telefon && (
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {rez.telefon}
                    </p>
                  )}
                  {rez.cod_rezervare && (
                    <p className="text-orange-400 text-xs font-mono mt-2 bg-gray-800 px-2 py-1 rounded inline-block">
                      Cod: {rez.cod_rezervare}
                    </p>
                  )}
                </div>

                {/* Detalii rezervare */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">{rez.data}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{rez.ora}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-semibold">{rez.persoane} {rez.persoane === 1 ? 'persoană' : 'persoane'}</span>
                  </div>

                  {rez.observatii && (
                    <div className="mt-3 bg-gray-800/50 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Observații:</p>
                      <p className="text-gray-300 text-sm">{rez.observatii}</p>
                    </div>
                  )}
                </div>

                {/* Butoane acțiuni */}
                <div className="flex gap-3">
                  <button
                    onClick={() => acceptaRezervare(rez)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acceptă
                  </button>

                  <button
                    onClick={() => respingeRezervare(rez)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Respinge
                  </button>
                </div>

                {/* Data creării */}
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Primită: {new Date(rez.created_at).toLocaleString('ro-RO')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRezervari;