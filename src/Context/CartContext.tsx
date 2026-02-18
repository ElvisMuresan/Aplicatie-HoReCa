import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { supabase } from "../SupabaseClient";

// 1️⃣ DEFINIM STRUCTURA DATELOR
type CartItem = {
  id: number;
  nume: string;
  pret: number;
  imagine?: string | null;
  cantitate: number;
};

// 2️⃣ DEFINIM FUNCȚIILE DISPONIBILE
type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "cantitate">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, cantitate: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

// 3️⃣ CREAM CONTEXTUL
const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper: key for user-scoped cart
const getUserCartKey = (userId: string) => `cart_${userId}`;
const GUEST_CART_KEY = "cart_guest";

// 4️⃣ PROVIDER
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Funcție pentru a încărca coșul din storage
  const loadCart = useCallback((userId: string | null) => {
    if (userId) {
      // Utilizator autentificat => încarcă din localStorage cu cheie user
      const saved = localStorage.getItem(getUserCartKey(userId));
      setCart(saved ? JSON.parse(saved) : []);
    } else {
      // Guest => încarcă din sessionStorage (se șterge la închidere tab)
      const saved = sessionStorage.getItem(GUEST_CART_KEY);
      setCart(saved ? JSON.parse(saved) : []);
    }
  }, []);

  // Salvează coșul în storage-ul corect
  useEffect(() => {
    if (!initialized) return;
    
    if (currentUserId) {
      localStorage.setItem(getUserCartKey(currentUserId), JSON.stringify(cart));
    } else {
      sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
  }, [cart, currentUserId, initialized]);

  // Monitorizează autentificarea
  useEffect(() => {
    // Verifică sesiunea inițială
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      setCurrentUserId(userId);
      userIdRef.current = userId;
      loadCart(userId);
      setInitialized(true);
    };

    initAuth();

    // Listener pentru schimbări de autentificare
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      const prevUserId = userIdRef.current;

      if (prevUserId && !newUserId) {
        // LOGOUT: golește coșul complet
        sessionStorage.removeItem(GUEST_CART_KEY);
        setCart([]);
      }

      setCurrentUserId(newUserId);
      userIdRef.current = newUserId;

      if (newUserId) {
        // LOGIN: încarcă coșul salvat al utilizatorului
        loadCart(newUserId);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Migrăm coșul vechi din localStorage["cart"] (one-time migration)
  useEffect(() => {
    const oldCart = localStorage.getItem("cart");
    if (oldCart) {
      localStorage.removeItem("cart");
    }
  }, []);

  // FUNCȚIE: ADAUGĂ ÎN COȘ
  const addToCart = (item: Omit<CartItem, "cantitate">) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, cantitate: i.cantitate + 1 } : i
        );
      }
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
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantitate } : i))
    );
  };

  // FUNCȚIE: GOLEȘTE COȘUL
  const clearCart = () => {
    setCart([]);
    if (currentUserId) {
      localStorage.removeItem(getUserCartKey(currentUserId));
    }
    sessionStorage.removeItem(GUEST_CART_KEY);
  };

  // CALCULE AUTOMATE
  const totalItems = cart.reduce((sum, item) => sum + item.cantitate, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.pret * item.cantitate, 0);

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

// 5️⃣ HOOK PERSONALIZAT
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};