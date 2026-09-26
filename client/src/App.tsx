import { useState, useEffect, useRef } from "react";
import { Header } from "./shared/components/Header";
import { AuthModal } from "./features/auth/AuthModal";
import { CatalogView, type Product } from "./features/catalog/CatalogView";
import { CartView } from "./features/cart/CartView";
import { CheckoutView } from "./features/checkout/CheckoutView";
import { AnalyticsDashboard } from "./features/analytics/AnalyticsDashboard";
import {
  apiFetch,
  refreshSession,
  setAccessToken,
} from "./shared/api";

interface FunnelRow {
  step_name: string;
  unique_users: string | number;
}

const getSessionUuid = (): string => {
  let uuid = localStorage.getItem("session_uuid");
  if (!uuid) {
    uuid = "sess_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("session_uuid", uuid);
  }
  return uuid;
};

const sessionUuid = getSessionUuid();

export default function App() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(
    null,
  );
  const [view, setView] = useState<string>("catalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [analyticsData, setAnalyticsData] = useState<FunnelRow[]>([]);

  const stepStartTime = useRef<number | null>(null);

  const trackStep = async (stepName: string, eventType: string = "view") => {
    const now = Date.now();
    const timeSpent = stepStartTime.current
      ? Math.floor((now - stepStartTime.current) / 1000)
      : 0;
    stepStartTime.current = now;
    try {
      await apiFetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionUuid, stepName, eventType, timeSpent }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    refreshSession()
      .then((session) => {
        if (isMounted && session) setUser(session.user);
      })
      .catch((err: unknown) => console.error("Session restore failed:", err));

    apiFetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch((err) => console.error(err));

    trackStep("catalog", "view");
    return () => {
      isMounted = false;
    };
  }, []);

  const changeView = (newView: string, product: Product | null = null) => {
    if (
      newView === "analytics" &&
      user?.role !== "admin" &&
      user?.role !== "analyst"
    ) {
      alert("У вас нет прав для просмотра аналитики воронки!");
      return;
    }
    setView(newView);
    if (product) setSelectedProduct(product);

    if (newView === "catalog") trackStep("catalog");
    if (newView === "product") trackStep("product");
    if (newView === "cart") trackStep("cart");
    if (newView === "checkout") trackStep("checkout_delivery");
    if (newView === "analytics") fetchAnalytics();
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/analytics/funnel");
      if (!res.ok) {
        throw new Error(`Analytics request failed with status ${res.status}`);
      }
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderSubmit = async (formData: {
    name: string;
    phone: string;
    address: string;
  }) => {
    trackStep("checkout_payment", "complete");
    const totalAmount = cart.reduce((sum, item) => sum + Number(item.price), 0);

    try {
      const response = await apiFetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionUuid,
          totalAmount,
          customerName: formData.name,
          phone: formData.phone,
          address: formData.address,
        }),
      });
      if (!response.ok) {
        throw new Error(`Order request failed with status ${response.status}`);
      }
      trackStep("success", "complete");
      setCart([]);
      setView("success");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans text-slate-800">
      <Header
        user={user}
        cartCount={cart.length}
        onNavigate={changeView}
        onLogout={() => {
          apiFetch("/api/auth/logout", { method: "POST" }).catch((err) =>
            console.error("Logout failed:", err),
          );
          setAccessToken(null);
          setUser(null);
          setView("catalog");
        }}
      />

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        {view === "auth" && (
          <AuthModal
            onLoginSuccess={(userData) => {
              setUser(userData);
              setView("catalog");
            }}
          />
        )}

        {view === "catalog" && (
          <CatalogView
            products={products}
            onSelectProduct={(prod) => {
              setSelectedProduct(prod);
              changeView("product", prod);
            }}
          />
        )}

        {view === "product" && selectedProduct && (
          <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2">
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              className="h-80 w-full rounded-2xl bg-slate-50 p-4 object-contain"
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                {selectedProduct.category}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2 mb-4">
                {selectedProduct.name}
              </h2>
              <p className="text-3xl font-extrabold text-slate-900 mb-6">
                {selectedProduct.price} руб.
              </p>
              <button
                className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700"
                onClick={() => {
                  setCart([...cart, selectedProduct]);
                  trackStep("cart", "click");
                  alert("Товар добавлен в корзину!");
                }}
              >
                Добавить в корзину
              </button>
            </div>
          </div>
        )}

        {view === "cart" && (
          <CartView cart={cart} onCheckout={() => changeView("checkout")} />
        )}

        {view === "checkout" && (
          <CheckoutView onSubmitOrder={handleOrderSubmit} />
        )}

        {view === "success" && (
          <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 py-16 text-center shadow-sm">
            <h2 className="mb-2 text-2xl font-bold text-emerald-700">
              Заказ успешно оформлен!
            </h2>
            <p className="mb-6 text-slate-500">
              Благодарим за покупку в Northstar Market.
            </p>
            <button
              className="rounded-xl bg-sky-600 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-700"
              onClick={() => changeView("catalog")}
            >
              Вернуться в каталог
            </button>
          </div>
        )}

        {view === "analytics" && (
          <AnalyticsDashboard
            data={analyticsData}
            role={user?.role || "Гость"}
          />
        )}
      </main>
    </div>
  );
}
