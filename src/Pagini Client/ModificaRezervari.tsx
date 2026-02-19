import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../SupabaseClient';

type Reservation = {
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
  telefon?: string | null;
};

export default function ModificaRezervare() {
  const params = useParams();
  const cod = params.cod || '';
  const id = params.id || '';

  const [loading, setLoading] = useState(true);
  const [rezervare, setRezervare] = useState<Reservation | null>(null);
  const [novaData, setNovaData] = useState('');
  const [novaOra, setNovaOra] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [tipMesaj, setTipMesaj] = useState<'success' | 'error'>('success');

  useEffect(() => {
    console.log('🔍 Params primiti:', { cod, id });
    if (cod && id) {
      incarcaRezervare();
    } else {
      console.error('❌ Lipsesc parametrii:', { cod, id });
      setMesaj('Link invalid - lipsesc parametrii');
      setTipMesaj('error');
      setLoading(false);
    }
  }, [cod, id]);

  const incarcaRezervare = async () => {
    console.log('📥 Încărcare rezervare:', { id, cod });
    try {
      const { data, error } = await supabase
        .from('rezervari')
        .select('*')
        .eq('id', id)
        .eq('cod_rezervare', cod)
        .single();
      
      console.log('📦 Răspuns Supabase SELECT:', { data, error });
      
      if (error) throw error;
      if (!data) throw new Error('Rezervare negăsită');
      
      setRezervare(data);
      setNovaData(data.data);
      setNovaOra(data.ora);
    } catch (error: any) {
      console.error('❌ Eroare la încărcarea rezervării:', error);
      setMesaj('Rezervarea nu a fost găsită');
      setTipMesaj('error');
    } finally {
      setLoading(false);
    }
  };

  const modificaRezervare = async () => {
    if (!novaData || !novaOra) {
      setMesaj('❌ Te rugăm să completezi data și ora');
      setTipMesaj('error');
      return;
    }
    try {
      setLoading(true);
      console.log('💾 Încercare modificare:', { id, cod, novaData, novaOra });
      
      const { data, error } = await supabase
        .from('rezervari')
        .update({
          data: novaData,
          ora: novaOra,
          status: 'pending'
        })
        .eq('id', id)
        .eq('cod_rezervare', cod)
        .select();
      
      console.log('📦 Răspuns Supabase UPDATE:', { data, error });
      
      if (error) {
        console.error('❌ EROARE DETALIATĂ:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      setMesaj('✅ Rezervarea a fost modificată! Vei primi un nou email de confirmare.');
      setTipMesaj('success');
      setTimeout(() => {
        incarcaRezervare();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Eroare catch:', error);
      setMesaj(`❌ Eroare: ${error.message || 'Eroare la modificarea rezervării'}`);
      setTipMesaj('error');
    } finally {
      setLoading(false);
    }
  };

  const anulaRezervare = async () => {
    if (!window.confirm('Ești sigur că vrei să anulezi rezervarea?')) return;
    try {
      setLoading(true);
      console.log('🗑️ Încercare anulare:', { id, cod });
      
      const { data, error } = await supabase
        .from('rezervari')
        .update({
          status: 'cancelled'
        })
        .eq('id', id)
        .eq('cod_rezervare', cod)
        .select();
      
      console.log('📦 Răspuns Supabase CANCEL:', { data, error });
      
      if (error) {
        console.error('❌ EROARE DETALIATĂ:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      setMesaj('✅ Rezervarea a fost anulată.');
      setTipMesaj('success');
      setTimeout(() => {
        incarcaRezervare();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Eroare catch:', error);
      setMesaj(`❌ Eroare: ${error.message || 'Eroare la anularea rezervării'}`);
      setTipMesaj('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!rezervare) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">❌ Rezervare negăsită</h2>
          <p className="text-gray-600">Codul de rezervare nu este valid.</p>
        </div>
      </div>
    );
  }

  const esteAnulata = rezervare.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* CSS pentru iconițele calendar și ceas */}
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📅 Modifică Rezervarea
            </h1>
            <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg font-mono text-xl">
              {cod}
            </div>
          </div>

          {/* ALERT ANULATĂ */}
          {esteAnulata && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-800 font-semibold">
                ⚠️ Această rezervare a fost anulată
              </p>
            </div>
          )}

          {/* DETALII CURENTE */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="font-bold text-lg mb-4">Detalii curente:</h3>
            <div className="space-y-2">
              <p><strong>Nume:</strong> {rezervare.nume}</p>
              <p><strong>Email:</strong> {rezervare.email}</p>
              {rezervare.telefon && <p><strong>Telefon:</strong> {rezervare.telefon}</p>}
              <p><strong>Data:</strong> {rezervare.data}</p>
              <p><strong>Ora:</strong> {rezervare.ora}</p>
              <p><strong>Persoane:</strong> {rezervare.persoane}</p>
              {rezervare.masa && <p><strong>Masă:</strong> {rezervare.masa}</p>}
              <p>
                <strong>Status:</strong>{' '}
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  rezervare.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  rezervare.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  rezervare.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rezervare.status === 'accepted' ? 'Confirmată' :
                   rezervare.status === 'pending' ? 'În așteptare' :
                   rezervare.status === 'cancelled' ? 'Anulată' :
                   rezervare.status}
                </span>
              </p>
            </div>
          </div>

          {/* FORMULAR MODIFICARE */}
          {!esteAnulata && (
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouă Dată
                  </label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Noua Oră
                  </label>
                  <input
                    type="time"
                    value={novaOra}
                    onChange={(e) => setNovaOra(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* MESAJ */}
              {mesaj && (
                <div className={`p-4 rounded-lg mb-6 ${
                  tipMesaj === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {mesaj}
                </div>
              )}

              {/* BUTOANE */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={modificaRezervare}
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  💾 Salvează Modificările
                </button>
                <button
                  onClick={anulaRezervare}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  🗑️ Anulează Rezervarea
                </button>
              </div>

              {/* INFO */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800">
                  ℹ️ După modificare, rezervarea va fi trimisă din nou pentru confirmare. 
                  Vei primi un email când va fi aprobată.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}