import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Header } from "./shared/components/Header";
import { Footer } from "./shared/components/Footer";
import { AuthModal } from "./features/auth/AuthModal";
import { CatalogView, type Product } from "./features/catalog/CatalogView";
import { ProductDetailView } from "./features/catalog/ProductDetailView";
import { CartView } from "./features/cart/CartView";
import { CheckoutView } from "./features/checkout/CheckoutView";
import { AnalyticsDashboard } from "./features/analytics/AnalyticsDashboard";
import { HomeView } from "./features/home/HomeView";
import { UsersView } from "./features/users/UsersView";
import { AdminProductsView } from "./features/products/AdminProductsView";
import { OrdersView } from "./features/orders/OrdersView";
import { apiFetch, refreshSession, setAccessToken } from "./shared/api";

interface FunnelRow {
  step_name: string;
  unique_users: string | number;
}

interface User {
  id?: string | number;
  email: string;
  role: string;
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

interface AccessRouteProps {
  user: User | null;
  loading: boolean;
  roles?: string[];
  deniedRoles?: string[];
  children: React.ReactNode;
}

const AccessRoute = ({
  user,
  loading,
  roles,
  deniedRoles,
  children,
}: AccessRouteProps) => {
  const location = useLocation();
  if (loading) {
    return (
      <div className="mx-auto my-auto flex min-h-40 w-full max-w-md items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span
          className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-600">
          Проверка сессии
        </span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (
    (roles && !roles.includes(user.role)) ||
    deniedRoles?.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProductRoute = ({
  products,
  onAddToCart,
  canAddToCart,
}: {
  products: Product[];
  onAddToCart: (product: Product) => void;
  canAddToCart: boolean;
}) => {
  const { productId } = useParams();
  const product = products.find((item) => String(item.id) === productId);
  if (!product) {
    return (
      <section className="mx-auto my-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Товар не найден</h1>
      </section>
    );
  }
  return (
    <ProductDetailView
      product={product}
      onAddToCart={onAddToCart}
      canAddToCart={canAddToCart}
    />
  );
};

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [analyticsData, setAnalyticsData] = useState<FunnelRow[]>([]);

  const stepStartTime = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const trackStep = useCallback(
    async (stepName: string, eventType: string = "view") => {
      const now = Date.now();
      const timeSpent = stepStartTime.current
        ? Math.floor((now - stepStartTime.current) / 1000)
        : 0;
      stepStartTime.current = now;
      try {
        await apiFetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionUuid,
            stepName,
            eventType,
            timeSpent,
          }),
        });
      } catch (error) {
        console.error("Funnel tracking failed:", error);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    refreshSession()
      .then((session) => {
        if (isMounted) {
          if (session) {
            setProductsLoading(true);
            setUser(session.user);
          } else {
            setProductsLoading(false);
          }
        }
      })
      .catch((error: unknown) => {
        console.error("Session restore failed:", error);
        if (isMounted) setProductsLoading(false);
      })
      .finally(() => {
        if (isMounted) setSessionLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    apiFetch("/api/products")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Products request failed with status ${response.status}`,
          );
        }
        const data: Product[] = await response.json();
        if (isMounted) {
          setProducts(data);
          setProductsError("");
        }
      })
      .catch((error: unknown) => {
        console.error("Products request failed:", error);
        if (isMounted)
          setProductsError("Не удалось загрузить каталог товаров.");
      })
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const routeToStep: Record<string, string> = {
      "/catalog": "catalog",
      "/cart": "cart",
      "/checkout": "checkout_delivery",
    };
    const step = location.pathname.startsWith("/products/")
      ? "product"
      : routeToStep[location.pathname];
    if (step) void trackStep(step);
  }, [location.pathname, trackStep]);

  useEffect(() => {
    if (location.pathname !== "/analytics" || !user) return;
    void apiFetch("/api/analytics/funnel")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Analytics request failed with status ${response.status}`,
          );
        }
        const data: FunnelRow[] = await response.json();
        setAnalyticsData(data);
      })
      .catch((error: unknown) =>
        console.error("Analytics request failed:", error),
      );
  }, [location.pathname, user]);

  const handleOrderSubmit = async (formData: {
    name: string;
    phone: string;
    address: string;
  }) => {
    void trackStep("checkout_payment", "complete");
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
      void trackStep("success", "complete");
      setCart([]);
      navigate("/success");
    } catch (error) {
      console.error("Order submission failed:", error);
    }
  };

  const handleNavigate = (view: string) => {
    const paths: Record<string, string> = {
      home: "/",
      catalog: "/catalog",
      auth: "/login",
      cart: "/cart",
      checkout: "/checkout",
      analytics: "/analytics",
      users: "/users",
      products: "/admin/products",
      orders: "/admin/orders",
    };
    navigate(paths[view] ?? "/");
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setCart([]);
      setProducts([]);
      setProductsLoading(false);
      navigate("/");
    }
  };

  const addToCart = (product: Product) => {
    setCart((currentCart) => [...currentCart, product]);
    void trackStep("cart", "click");
    window.alert("Товар добавлен в корзину!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-sky-50 via-white to-indigo-50 font-sans text-slate-800">
      <Header
        user={user}
        cartCount={cart.length}
        onNavigate={handleNavigate}
        onLogout={logout}
      />

      <main className="flex min-w-0 flex-1 flex-col items-center justify-center">
        <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-1 flex-col items-center justify-center">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/catalog" replace />
                ) : (
                  <AuthModal
                    onLoginSuccess={(userData) => {
                      setProductsLoading(true);
                      setUser(userData);
                      navigate("/catalog", { replace: true });
                    }}
                  />
                )
              }
            />
            <Route
              path="/catalog"
              element={
                <AccessRoute user={user} loading={sessionLoading}>
                  {productsLoading ? (
                    <div className="mx-auto my-auto rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center text-slate-500 shadow-sm">
                      Загружаем каталог...
                    </div>
                  ) : productsError ? (
                    <p
                      role="alert"
                      className="mx-auto my-auto rounded-2xl border border-red-100 bg-white p-6 text-center text-red-700 shadow-sm"
                    >
                      {productsError}
                    </p>
                  ) : (
                    <CatalogView
                      products={products}
                      onSelectProduct={(product) =>
                        navigate(`/products/${product.id}`)
                      }
                    />
                  )}
                </AccessRoute>
              }
            />
            <Route
              path="/products/:productId"
              element={
                <AccessRoute user={user} loading={sessionLoading}>
                  {productsLoading ? (
                    <div className="mx-auto my-auto rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center text-slate-500 shadow-sm">
                      Загружаем товар...
                    </div>
                  ) : (
                    <ProductRoute
                      products={products}
                      onAddToCart={addToCart}
                      canAddToCart={user?.role !== "admin"}
                    />
                  )}
                </AccessRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <AccessRoute
                  user={user}
                  loading={sessionLoading}
                  deniedRoles={["admin"]}
                >
                  <CartView
                    cart={cart}
                    onCheckout={() => navigate("/checkout")}
                  />
                </AccessRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <AccessRoute
                  user={user}
                  loading={sessionLoading}
                  deniedRoles={["admin"]}
                >
                  <CheckoutView onSubmitOrder={handleOrderSubmit} />
                </AccessRoute>
              }
            />
            <Route
              path="/success"
              element={
                <AccessRoute user={user} loading={sessionLoading}>
                  <section className="mx-auto my-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 py-16 text-center shadow-sm">
                    <h1 className="mb-2 text-2xl font-bold text-emerald-700">
                      Заказ успешно оформлен!
                    </h1>
                    <p className="mb-6 text-slate-500">
                      Благодарим за покупку в Northstar Market.
                    </p>
                    <button
                      className="rounded-xl bg-sky-600 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-700"
                      onClick={() => navigate("/catalog")}
                    >
                      Вернуться в каталог
                    </button>
                  </section>
                </AccessRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <AccessRoute
                  user={user}
                  loading={sessionLoading}
                  roles={["admin", "analyst"]}
                >
                  <AnalyticsDashboard data={analyticsData} />
                </AccessRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AccessRoute
                  user={user}
                  loading={sessionLoading}
                  roles={["admin"]}
                >
                  <UsersView />
                </AccessRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AccessRoute
                  user={user}
                  loading={sessionLoading}
                  roles={["admin"]}
                >
                  <AdminProductsView />
                </AccessRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AccessRoute
                  user={user}
                  loading={sessionLoading}
                  roles={["admin"]}
                >
                  <OrdersView />
                </AccessRoute>
              }
            />
            <Route
              path="*"
              element={
                <section className="mx-auto my-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Страница не найдена
                  </h1>
                  <button
                    className="mt-5 font-semibold text-sky-700 hover:text-sky-900"
                    onClick={() => navigate("/")}
                  >
                    На главную
                  </button>
                </section>
              }
            />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
