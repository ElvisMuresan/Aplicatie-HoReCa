import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

// 1️⃣ DEFINIM STRUCTURA DATELOR
// ----------------------------------
// Cum arată un produs în coș?
type CartItem = {
  id: number;           // ID-ul produsului din baza de date
  nume: string;         // "Pizza Margherita"
  pret: number;         // 35.50
  imagine?: string | null; // URL imagine
  cantitate: number;    // Câte bucăți vrea utilizatorul
};

// 2️⃣ DEFINIM FUNCȚIILE DISPONIBILE
// ----------------------------------
// Ce operații putem face cu coșul?
type CartContextType = {
  cart: CartItem[];                                    // Lista produselor
  addToCart: (item: Omit<CartItem, "cantitate">) => void;  // Adaugă produs
  removeFromCart: (id: number) => void;                // Șterge produs
  updateQuantity: (id: number, cantitate: number) => void; // Modifică cantitatea
  clearCart: () => void;                               // Golește coșul
  totalItems: number;                                  // Total produse (ex: 5)
  totalPrice: number;                                  // Total preț (ex: 127.50)
};

// 3️⃣ CREAM CONTEXTUL
// ----------------------------------
// Contextul este "cutia" în care punem datele
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4️⃣ PROVIDER - COMPONENTA CARE FURNIZEAZĂ DATELE
// ----------------------------------
export const CartProvider = ({ children }: { children: ReactNode }) => {
  
  // STATE-UL COȘULUI
  // Încercăm să încărcăm coșul din localStorage (dacă există)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // SALVĂM ÎN LOCALSTORAGE LA FIECARE SCHIMBARE
  // Astfel coșul persistă chiar dacă reîmprospătezi pagina!
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // FUNCȚIE: ADAUGĂ ÎN COȘ
  const addToCart = (item: Omit<CartItem, "cantitate">) => {
    setCart((prev) => {
      // Verificăm dacă produsul există deja în coș
      const existing = prev.find((i) => i.id === item.id);
      
      if (existing) {
        // Dacă există, creștem cantitatea
        return prev.map((i) =>
          i.id === item.id 
            ? { ...i, cantitate: i.cantitate + 1 } 
            : i
        );
      }
      
      // Dacă NU există, îl adăugăm cu cantitate 1
      return [...prev, { ...item, cantitate: 1 }];
    });
  };

  // FUNCȚIE: ȘTERGE DIN COȘ
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // FUNCȚIE: MODIFICĂ CANTITATEA
  const updateQuantity = (id: number, cantitate: number) => {
    if (cantitate <= 0) {
      // Dacă cantitatea e 0 sau negativă, ștergem produsul
      removeFromCart(id);
      return;
    }
    
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantitate } : i))
    );
  };

  // FUNCȚIE: GOLEȘTE COȘUL
  const clearCart = () => setCart([]);

  // CALCULE AUTOMATE
  const totalItems = cart.reduce((sum, item) => sum + item.cantitate, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.pret * item.cantitate, 0);

  // RETURNĂM PROVIDER-UL CU TOATE DATELE
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 5️⃣ HOOK PERSONALIZAT PENTRU ACCES UȘOR
// ----------------------------------
export const useCart = () => {
  const context = useContext(CartContext);
  
  // Verificăm că hook-ul e folosit DOAR în componente înăuntrul Provider-ului
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  
  return context;
};