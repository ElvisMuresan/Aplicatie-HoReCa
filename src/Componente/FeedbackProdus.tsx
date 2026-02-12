import { useState } from "react";
import { supabase } from "../SupabaseClient";

type TipCod = 'CMD' | 'REZ';

interface Produs {
  produs_id: number;
  nume: string;
  cantitate: number;
  imagine?: string;
}

type Props = {
  produsId?: number;
  produsNume?: string;
  onClose: () => void;
  onSuccess: () => void;
  userEmail?: string | null;
};

const FeedbackProdusModal = ({ onClose, onSuccess, userEmail }: Props) => {
  // STEP 1: Verificare cod
  const [step, setStep] = useState<"verificare" | "recenzie" | "success">("verificare");
  const [tipCod, setTipCod] = useState<TipCod>('CMD');
  const [codReferinta, setCodReferinta] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [nume, setNume] = useState('');
  
  // STEP 2: Produse și rating-uri
  const [produseDisponibile, setProduseDisponibile] = useState<Produs[]>([]);
  const [recenziiProduse, setRecenziiProduse] = useState<{
    [key: number]: { rating: number; comentariu: string; hoveredStar: number }
  }>({});
  
  const [ratingGeneral, setRatingGeneral] = useState(0);
  const [comentariuGeneral, setComentariuGeneral] = useState('');
  const [hoveredStarGeneral, setHoveredStarGeneral] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');

  // Verifică codul introdus
  const verificaCod = async () => {
    if (!codReferinta || !email) {
      setMesaj('❌ Completează codul și emailul');
      return;
    }

    if (!nume.trim()) {
      setMesaj('❌ Completează numele');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMesaj('❌ Email invalid');
      return;
    }

    setLoading(true);
    setMesaj('');

    try {
      const { data, error } = await supabase
        .rpc('verifica_cod_feedback', {
          p_tip_cod: tipCod,
          p_cod_referinta: codReferinta,
          p_email: email
        });

      if (error) throw error;

      const result = data[0];
      
      if (!result.valid) {
        setMesaj(`❌ ${result.mesaj}`);
        setLoading(false);
        return;
      }

      setMesaj(`✅ ${result.mesaj}`);

      if (tipCod === 'CMD' && result.produse) {
        setProduseDisponibile(result.produse);
        // Inițializează rating-urile pentru fiecare produs
        const initialRatings: any = {};
        result.produse.forEach((p: Produs) => {
          initialRatings[p.produs_id] = { rating: 0, comentariu: '', hoveredStar: 0 };
        });
        setRecenziiProduse(initialRatings);
      }

      setStep('recenzie');

    } catch (err) {
      console.error(err);
      setMesaj('❌ Eroare la verificarea codului');
    } finally {
      setLoading(false);
    }
  };

  // Trimite recenziile
  const trimiteRecenzii = async () => {
    setLoading(true);
    setMesaj('');
    
    try {
      if (tipCod === 'CMD') {
        // Validare: cel puțin un produs cu rating
        const recenziiDeTrimis = Object.entries(recenziiProduse)
          .filter(([_, rec]) => rec.rating > 0)
          .map(([produs_id, rec]) => ({
            tip_cod: 'CMD',
            cod_referinta: codReferinta,
            produs_id: parseInt(produs_id),
            rating: rec.rating,
            comentariu: rec.comentariu.trim() || null,
            nume_client: nume,
            email: email,
            email_confirmat: true // Deja verificat prin cod
          }));

        if (recenziiDeTrimis.length === 0) {
          setMesaj('❌ Selectează cel puțin un rating pentru un produs');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('feedback_produse')
          .insert(recenziiDeTrimis);

        if (error) throw error;

        setStep('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
        
      } else {
        // REZ - recenzie generală
        if (ratingGeneral === 0) {
          setMesaj('❌ Selectează un rating');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('feedback_produse')
          .insert({
            tip_cod: 'REZ',
            cod_referinta: codReferinta,
            produs_id: null,
            rating: ratingGeneral,
            comentariu: comentariuGeneral.trim() || null,
            nume_client: nume,
            email: email,
            email_confirmat: true
          });

        if (error) throw error;

        setStep('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }

    } catch (err: any) {
      console.error(err);
      setMesaj('❌ Eroare la trimiterea recenziei: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ECRAN SUCCESS
  if (step === "success") {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-800 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Mulțumim!
          </h2>
          <p className="text-gray-300 text-lg mb-6">
            Recenzia ta a fost publicată cu succes!
          </p>
          <div className="text-5xl mb-4">⭐</div>
        </div>
      </div>
    );
  }

  // ECRAN RECENZIE
  if (step === "recenzie") {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-zinc-900 rounded-2xl p-6 max-w-2xl w-full border border-zinc-800 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 mb-6">
            <p className="text-green-300 font-semibold flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Cod verificat: {codReferinta}</span>
            </p>
            <p className="text-green-200/80 text-sm mt-1">{email}</p>
          </div>

          {tipCod === 'CMD' ? (
            // RECENZII PRODUSE
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🛍️</span>
                <span>Recenzează Produsele</span>
              </h3>
              
              {produseDisponibile.map((produs) => (
                <div key={produs.produs_id} className="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
                  <div className="flex items-start gap-4 mb-4">
                    {produs.imagine && (
                      <img 
                        src={produs.imagine} 
                        alt={produs.nume}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-white">
                        {produs.nume}
                      </h4>
                      <p className="text-sm text-gray-400">
                        Cantitate: {produs.cantitate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Rating
                      </label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setRecenziiProduse({
                              ...recenziiProduse,
                              [produs.produs_id]: {
                                ...recenziiProduse[produs.produs_id],
                                hoveredStar: star
                              }
                            })}
                            onMouseLeave={() => setRecenziiProduse({
                              ...recenziiProduse,
                              [produs.produs_id]: {
                                ...recenziiProduse[produs.produs_id],
                                hoveredStar: 0
                              }
                            })}
                            onClick={() => setRecenziiProduse({
                              ...recenziiProduse,
                              [produs.produs_id]: {
                                ...recenziiProduse[produs.produs_id],
                                rating: star
                              }
                            })}
                            className="focus:outline-none hover:scale-125 transition-transform"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill={
                                star <= (recenziiProduse[produs.produs_id]?.hoveredStar || recenziiProduse[produs.produs_id]?.rating || 0)
                                  ? "#facc15"
                                  : "#4b5563"
                              }
                              className="w-10 h-10"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Comentariu (opțional)
                      </label>
                      <textarea
                        placeholder="Ce ți-a plăcut sau ce ai îmbunătăți?"
                        value={recenziiProduse[produs.produs_id]?.comentariu || ''}
                        onChange={(e) => setRecenziiProduse({
                          ...recenziiProduse,
                          [produs.produs_id]: {
                            ...recenziiProduse[produs.produs_id],
                            comentariu: e.target.value
                          }
                        })}
                        className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // RECENZIE GENERALĂ REZERVARE
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🍽️</span>
                <span>Experiența Ta</span>
              </h3>
              
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-300 text-center">
                  Cum a fost experiența ta la restaurant?
                </label>
                <div className="flex gap-2 justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStarGeneral(star)}
                      onMouseLeave={() => setHoveredStarGeneral(0)}
                      onClick={() => setRatingGeneral(star)}
                      className="focus:outline-none hover:scale-125 transition-transform"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill={
                          star <= (hoveredStarGeneral || ratingGeneral)
                            ? "#facc15"
                            : "#4b5563"
                        }
                        className="w-12 h-12"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {ratingGeneral > 0 && (
                  <p className="text-center text-gray-400 font-semibold">
                    {ratingGeneral === 5 ? '🎉 Excelent!' : 
                     ratingGeneral === 4 ? '😊 Foarte bine!' :
                     ratingGeneral === 3 ? '👍 Bine' :
                     ratingGeneral === 2 ? '😐 Acceptabil' :
                     '😞 Sub așteptări'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Comentariu
                </label>
                <textarea
                  placeholder="Spune-ne despre servire, atmosferă, mâncare..."
                  value={comentariuGeneral}
                  onChange={(e) => setComentariuGeneral(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 resize-none"
                  rows={5}
                />
              </div>
            </div>
          )}

          {mesaj && (
            <div className={`mt-4 p-4 rounded-lg border-l-4 ${
              mesaj.includes('✅') 
                ? 'bg-green-900/30 border-green-500 text-green-300' 
                : 'bg-red-900/30 border-red-500 text-red-300'
            }`}>
              {mesaj}
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep('verificare')}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition"
            >
              ← Înapoi
            </button>
            <button
              onClick={trimiteRecenzii}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? '📤 Trimitere...' : '✓ Trimite Recenzie'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ECRAN VERIFICARE COD
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          📝 Lasă o Recenzie
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Verifică-ți comanda sau rezervarea
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Tip Cod
            </label>
            <select
              value={tipCod}
              onChange={(e) => setTipCod(e.target.value as TipCod)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="CMD">🛍️ Comandă (CMD-XXXX)</option>
              <option value="REZ">🍽️ Rezervare (REZ-XXXX)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {tipCod === 'CMD' 
                ? 'Vei putea recenza fiecare produs din comanda ta'
                : 'Vei putea recenza experiența ta generală'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Cod {tipCod === 'CMD' ? 'Comandă' : 'Rezervare'}
            </label>
            <input
              type="text"
              placeholder={tipCod === 'CMD' ? 'Ex: CMD-0001' : 'Ex: REZ-0001'}
              value={codReferinta}
              onChange={(e) => setCodReferinta(e.target.value.toUpperCase())}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Email
            </label>
            <input
              type="email"
              placeholder="email@exemplu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!userEmail}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Folosește emailul de la comandă/rezervare
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Nume
            </label>
            <input
              type="text"
              placeholder="Numele tău"
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
            />
          </div>

          {mesaj && (
            <div className={`p-4 rounded-lg border-l-4 ${
              mesaj.includes('✅') 
                ? 'bg-green-900/30 border-green-500 text-green-300' 
                : 'bg-red-900/30 border-red-500 text-red-300'
            }`}>
              {mesaj}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Anulează
            </button>
            <button
              onClick={verificaCod}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? '🔍 Verificare...' : '🔍 Verifică Cod'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackProdusModal;