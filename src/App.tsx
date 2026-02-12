import { CartProvider } from "./Context/CartContext"; // ✅ Importăm provider-ul
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <CartProvider>  {/* ✅ Înfășurăm totul */}
      <AppRoutes />
    </CartProvider>
  );
}

export default App;