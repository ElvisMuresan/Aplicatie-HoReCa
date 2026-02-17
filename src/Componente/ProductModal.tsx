import type { Produs } from "../types/Produse";

type ProductModalProps = {
  produs: Produs;
  onClose: () => void;
  onAddToCart: (produs: Produs) => void;
};

const ProductModal = ({ produs, onClose, onAddToCart }: ProductModalProps) => {
  const handleAddToCart = () => {
    onAddToCart(produs);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Container modal */}
      <div
        className="relative bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-zinc-700 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Buton închidere */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-zinc-800 hover:bg-zinc-700 rounded-full w-10 h-10 flex items-center justify-center text-white transition"
          aria-label="Închide"
        >
          ✕
        </button>

        {/* Imagine - afișare completă */}
        {produs.imagine && (
          <div className="w-full bg-black flex items-center justify-center">
            <img
              src={produs.imagine}
              alt={produs.nume}
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>
        )}

        {/* Conținut */}
        <div className="p-6">
          {/* Nume produs */}
          <h2 className="text-2xl font-bold text-white mb-2">{produs.nume}</h2>

          {/* Preț */}
          <p className="text-orange-500 font-extrabold text-xl mb-4">
            {produs.pret} lei
          </p>

          {/* Descriere completă */}
          {produs.descriere && (
            <div className="mb-6">
              <h3 className="text-gray-400 text-sm font-semibold mb-2">Descriere:</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {produs.descriere}
              </p>
            </div>
          )}

          {/* Buton adaugă în coș */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-lg"
          >
            🛒 Adaugă în coș
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
