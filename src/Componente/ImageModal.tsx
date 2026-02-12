type ImageModalProps = {
  image: string;
  title?: string | null;
  onClose: () => void;
};

const ImageModal = ({ image, title, onClose }: ImageModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      {/* Container modal */}
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Buton inchidere */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white rounded-full shadow-md w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100"
          aria-label="Închide imaginea"
        >
          ✕
        </button>

        {/* Imagine */}
        <img
          src={image}
          alt={title ?? "Imagine produs"}
          className="w-full max-h-[80vh] object-contain bg-black"
        />

        {/* Titlu optional */}
        {title && (
          <div className="p-3 text-center text-gray-800 font-semibold">
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
