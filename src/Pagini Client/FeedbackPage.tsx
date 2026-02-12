import { useState } from "react";
import NavbarClient from "../Componente/NavbarClient";
import { useNavigate } from "react-router-dom";
import { supabase } from "../SupabaseClient";

const FeedbackPage = () => {
  type FeedbackKey = "mancare" | "personal" | "locatie" | "sugestii";
  type FeedbackState = {
    [K in FeedbackKey]: { rating: number | null; continut: string };
  };

  const [feedback, setFeedback] = useState<FeedbackState>({
    mancare: { rating: null, continut: "" },
    personal: { rating: null, continut: "" },
    locatie: { rating: null, continut: "" },
    sugestii: { rating: null, continut: "" },
  });

  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSetFilter = (filter: "mancare" | "bauturi" | null) => {
    if (filter === null) navigate("/meniu");
    else navigate(`/meniu?filter=${filter}`);
  };

  const handleSubmit = async () => {
    const toSend = {
      mancare_continut: feedback.mancare.continut.trim() || null,
      mancare_rating: feedback.mancare.rating,
      personal_continut: feedback.personal.continut.trim() || null,
      personal_rating: feedback.personal.rating,
      locatie_continut: feedback.locatie.continut.trim() || null,
      locatie_rating: feedback.locatie.rating,
      sugestii_continut: feedback.sugestii.continut.trim() || null,
      // ❌ sugestii_rating eliminat
    };

    const hasFeedback = Object.values(toSend).some(
      (v) => v !== null && v !== ""
    );
    if (!hasFeedback) {
      alert("Completează cel puțin o secțiune sau selectează stele.");
      return;
    }

    const { error } = await supabase.from("feedback").insert([toSend]);

    if (error) {
      alert("Eroare la trimiterea feedback-ului.");
      console.error(error);
    } else {
      setSubmitted(true);
      setFeedback({
        mancare: { rating: null, continut: "" },
        personal: { rating: null, continut: "" },
        locatie: { rating: null, continut: "" },
        sugestii: { rating: null, continut: "" },
      });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <NavbarClient filter={null} setFilter={handleSetFilter} />

      <div className="max-w-2xl mx-auto p-6 mt-10">
        {submitted ? (
          <div className="text-center p-6 bg-green-900 text-green-300 rounded-2xl shadow-md font-semibold border border-green-700">
            Mulțumim pentru feedback! 💚
          </div>
        ) : (
          <div className="bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-800">
            <h2 className="text-2xl font-extrabold mb-8 text-white text-center">
              Spune-ne părerea ta 💬
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { key: "mancare", label: "Mâncare" },
                { key: "personal", label: "Personal" },
                { key: "locatie", label: "Locație" },
                { key: "sugestii", label: "Sugestii" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-bold text-lg mb-3 text-white">
                    {label}
                  </h3>

                  {/* Stele */}
                  {key !== "sugestii" && (
                    <>
                      <label className="block mb-2 font-semibold text-gray-300">
                        Rating (opțional)
                      </label>
                      <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setFeedback((f) => ({
                                ...f,
                                [key as FeedbackKey]: {
                                  ...f[key as FeedbackKey],
                                  rating: star,
                                },
                              }))
                            }
                            className="focus:outline-none hover:scale-110 transition"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill={
                                feedback[key as FeedbackKey].rating !== null &&
                                star <= feedback[key as FeedbackKey].rating!
                                  ? "#facc15"
                                  : "#4b5563"
                              }
                              className="w-7 h-7"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Textarea */}
                  <label className="block mb-2 font-semibold text-gray-300">
                    Feedback (opțional)
                  </label>
                  <textarea
                    rows={3}
                    value={feedback[key as FeedbackKey].continut}
                    onChange={(e) =>
                      setFeedback((f) => ({
                        ...f,
                        [key as FeedbackKey]: {
                          ...f[key as FeedbackKey],
                          continut: e.target.value,
                        },
                      }))
                    }
                    placeholder={`Scrie aici feedback pentru ${label}...`}
                    className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder-gray-400"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              className="mt-10 w-full bg-orange-500 text-white font-bold py-3 rounded-full hover:bg-orange-600 transition"
            >
              Trimite feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;