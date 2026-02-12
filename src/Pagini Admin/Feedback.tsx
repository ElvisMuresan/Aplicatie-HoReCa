import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import Navbar from "../Componente/NavbarAdmin";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

type Feedback = {
	id: number;
	mancare_continut: string | null;
	mancare_rating: number | null;
	personal_continut: string | null;
	personal_rating: number | null;
	locatie_continut: string | null;
	locatie_rating: number | null;
	sugestii_continut: string | null;
};

const FeedbackAdmin = () => {
	const [feedbackuri, setFeedbackuri] = useState<Feedback[]>([]);
	const [loading, setLoading] = useState(true);
	const [mediaRating, setMediaRating] = useState({ mancare: 0, personal: 0, locatie: 0 });

	useEffect(() => {
		const fetchFeedback = async () => {
			const { data, error } = await supabase
				.from("feedback")
				.select("*")
				.order("id", { ascending: false });
			if (error) console.error(error);
			else {
				setFeedbackuri(data || []);
				calculeazaMedia(data || []);
			}
			setLoading(false);
		};
		fetchFeedback();
	}, []);

	const calculeazaMedia = (feedbackuri: Feedback[]) => {
		const calcMedie = (vals: (number | null)[]) => {
			const filtrat = vals.filter((v): v is number => v !== null);
			if (filtrat.length === 0) return 0;
			return parseFloat((filtrat.reduce((a, b) => a + b, 0) / filtrat.length).toFixed(2));
		};
		setMediaRating({
			mancare: calcMedie(feedbackuri.map(f => f.mancare_rating)),
			personal: calcMedie(feedbackuri.map(f => f.personal_rating)),
			locatie: calcMedie(feedbackuri.map(f => f.locatie_rating)),
		});
	};

	// Funcție pentru a afișa stelele
	const renderStars = (rating: number) => {
		const stars = [];
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<svg
					key={i}
					className="w-5 h-5"
					fill={i <= rating ? "#facc15" : "#4b5563"}
					viewBox="0 0 20 20"
				>
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.174 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" />
				</svg>
			);
		}
		return <div className="flex gap-1">{stars}</div>;
	};

	if (loading)
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<p className="text-orange-500 font-semibold animate-pulse">Se încarcă feedback-urile...</p>
			</div>
		);

	// Date pentru grafic orizontal
	const dataGrafic = [
		{ categorie: "Mâncare", rating: mediaRating.mancare, color: "#f97316" },
		{ categorie: "Personal", rating: mediaRating.personal, color: "#3b82f6" },
		{ categorie: "Locație", rating: mediaRating.locatie, color: "#10b981" },
	];

	return (
		<div className="min-h-screen bg-black">
			<Navbar />
			<div className="max-w-7xl mx-auto p-6">
				{/* HEADER */}
				<div className="mb-8">
					<h1 className="text-3xl font-extrabold text-white mb-2">📊 Analiză Feedback</h1>
					<p className="text-gray-400">Vizualizare rating-uri și comentarii clienți</p>
				</div>

				{/* STATISTICI CARDS */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
					<div className="bg-liniar-to-br from-orange-600 to-orange-800 rounded-xl p-6 shadow-lg border border-orange-500">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-white font-bold text-lg">🍽️ Mâncare</h3>
							<span className="text-white text-2xl font-extrabold">{mediaRating.mancare.toFixed(1)}</span>
						</div>
						{renderStars(Math.round(mediaRating.mancare))}
					</div>

					<div className="bg-liniar-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg border border-blue-500">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-white font-bold text-lg">👥 Personal</h3>
							<span className="text-white text-2xl font-extrabold">{mediaRating.personal.toFixed(1)}</span>
						</div>
						{renderStars(Math.round(mediaRating.personal))}
					</div>

					<div className="bg-liniar-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-lg border border-green-500">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-white font-bold text-lg">📍 Locație</h3>
							<span className="text-white text-2xl font-extrabold">{mediaRating.locatie.toFixed(1)}</span>
						</div>
						{renderStars(Math.round(mediaRating.locatie))}
					</div>
				</div>

				{/* GRAFIC ORIZONTAL */}
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10 shadow-lg">
					<h2 className="text-xl font-bold text-white mb-6">📈 Media Rating-urilor</h2>
					<div className="w-full h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart 
								data={dataGrafic} 
								layout="vertical"
								margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
							>
								<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
								<XAxis type="number" domain={[0, 5]} stroke="#9ca3af" />
								<YAxis type="category" dataKey="categorie" stroke="#9ca3af" />
								<Tooltip 
									contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
									labelStyle={{ color: '#fff' }}
								/>
								<Bar dataKey="rating" radius={[0, 8, 8, 0]}>
									{dataGrafic.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* LISTA FEEDBACK */}
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
					<h2 className="text-2xl font-bold text-white mb-6">💬 Feedback-uri Detaliate</h2>
					{feedbackuri.length === 0 ? (
						<p className="text-gray-400 text-center py-8">Nu există feedback-uri.</p>
					) : (
						<div className="space-y-4">
							{feedbackuri.map((f) => (
								<div key={f.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-orange-500 transition">
									<div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-700">
										<span className="text-xs font-semibold text-gray-400">Feedback #{f.id}</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* MÂNCARE */}
										{(f.mancare_continut || f.mancare_rating) && (
											<div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-lg">🍽️</span>
													<h3 className="font-semibold text-white">Mâncare</h3>
												</div>
												{f.mancare_rating && (
													<div className="flex items-center gap-2 mb-2">
														{renderStars(f.mancare_rating)}
														<span className="text-yellow-400 font-bold">{f.mancare_rating}/5</span>
													</div>
												)}
												{f.mancare_continut && (
													<p className="text-gray-300 text-sm italic">"{f.mancare_continut}"</p>
												)}
											</div>
										)}

										{/* PERSONAL */}
										{(f.personal_continut || f.personal_rating) && (
											<div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-lg">👥</span>
													<h3 className="font-semibold text-white">Personal</h3>
												</div>
												{f.personal_rating && (
													<div className="flex items-center gap-2 mb-2">
														{renderStars(f.personal_rating)}
														<span className="text-yellow-400 font-bold">{f.personal_rating}/5</span>
													</div>
												)}
												{f.personal_continut && (
													<p className="text-gray-300 text-sm italic">"{f.personal_continut}"</p>
												)}
											</div>
										)}

										{/* LOCAȚIE */}
										{(f.locatie_continut || f.locatie_rating) && (
											<div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-lg">📍</span>
													<h3 className="font-semibold text-white">Locație</h3>
												</div>
												{f.locatie_rating && (
													<div className="flex items-center gap-2 mb-2">
														{renderStars(f.locatie_rating)}
														<span className="text-yellow-400 font-bold">{f.locatie_rating}/5</span>
													</div>
												)}
												{f.locatie_continut && (
													<p className="text-gray-300 text-sm italic">"{f.locatie_continut}"</p>
												)}
											</div>
										)}

										{/* SUGESTII */}
										{f.sugestii_continut && (
											<div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 md:col-span-2">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-lg">💡</span>
													<h3 className="font-semibold text-white">Sugestii</h3>
												</div>
												<p className="text-gray-300 text-sm italic">"{f.sugestii_continut}"</p>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FeedbackAdmin;