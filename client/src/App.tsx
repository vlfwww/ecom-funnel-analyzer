import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart, BarChart2, Home } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

interface FunnelAnalyticsRow {
  step_name: string;
  unique_users: string | number;
}

interface OrderForm {
  name: string;
  phone: string;
  address: string;
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
  const [view, setView] = useState<string>("catalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<Product[]>([]);

  const [formData, setFormData] = useState<OrderForm>({
    name: "",
    phone: "",
    address: "",
  });
  const [analyticsData, setAnalyticsData] = useState<FunnelAnalyticsRow[]>([]);

  const stepStartTime = useRef<number>(Date.now());

  const trackStep = async (stepName: string, eventType: string = "view") => {
    const timeSpent = Math.floor((Date.now() - stepStartTime.current) / 1000);
    stepStartTime.current = Date.now();

    try {
      await fetch("http://localhost:5000/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionUuid, stepName, eventType, timeSpent }),
      });
    } catch (e) {
      console.error("Tracking error:", e);
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch((err) => console.error(err));

    trackStep("catalog", "view");
  }, []);

  const changeView = (newView: string, product: Product | null = null) => {
    setView(newView);
    if (product) setSelectedProduct(product);

    if (newView === "catalog") trackStep("catalog");
    if (newView === "product") trackStep("product");
    if (newView === "cart") trackStep("cart");
    if (newView === "checkout") trackStep("checkout_delivery");
    if (newView === "analytics") fetchAnalytics();
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
    trackStep("cart", "click");
    alert("Товар добавлен в корзину!");
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/analytics/funnel");
      const data: FunnelAnalyticsRow[] = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackStep("checkout_payment", "complete");

    const totalAmount = cart.reduce((sum, item) => sum + Number(item.price), 0);

    try {
      await fetch("http://localhost:5000/api/order", {
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

      trackStep("success", "complete");
      setCart([]);
      setView("success");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <header>
        <div className="logo" onClick={() => changeView("catalog")}>
          5 ЭЛЕМЕНТ{" "}
          <span style={{ fontSize: "14px", fontWeight: "normal" }}>
            (Курсовая TS)
          </span>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => changeView("catalog")}
          >
            <Home size={16} /> Каталог
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => changeView("cart")}
          >
            <ShoppingCart size={16} /> Корзина ({cart.length})
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => changeView("analytics")}
          >
            <BarChart2 size={16} /> Дашборд воронки
          </button>
        </div>
      </header>

      <div className="container">
        {view === "catalog" && (
          <div>
            <h2>Каталог товаров</h2>
            <div className="grid" style={{ marginTop: "20px" }}>
              {products.map((prod) => (
                <div key={prod.id} className="card">
                  <img src={prod.image_url} alt={prod.name} />
                  <div>
                    <span style={{ fontSize: "12px", color: "#777" }}>
                      {prod.category}
                    </span>
                    <h4 style={{ margin: "5px 0" }}>{prod.name}</h4>
                    <p
                      style={{
                        color: "#cc0000",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      {prod.price} руб.
                    </p>
                  </div>
                  <button
                    className="btn"
                    style={{ marginTop: "10px" }}
                    onClick={() => changeView("product", prod)}
                  >
                    Подробнее
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "product" && selectedProduct && (
          <div className="card" style={{ flexDirection: "row", gap: "30px" }}>
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              style={{ width: "400px" }}
            />
            <div>
              <h2>{selectedProduct.name}</h2>
              <p style={{ color: "#777", margin: "10px 0" }}>
                Категория: {selectedProduct.category}
              </p>
              <h3
                style={{ color: "#cc0000", fontSize: "24px", margin: "15px 0" }}
              >
                {selectedProduct.price} руб.
              </h3>
              <p>Описание товара, характеристики и условия гарантии.</p>
              <br />
              <button
                className="btn"
                onClick={() => addToCart(selectedProduct)}
              >
                В корзину
              </button>
            </div>
          </div>
        )}

        {view === "cart" && (
          <div>
            <h2>Корзина покупателя</h2>
            {cart.length === 0 ? (
              <p style={{ marginTop: "20px" }}>Ваша корзина пуста.</p>
            ) : (
              <div style={{ marginTop: "20px" }}>
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span>{item.name}</span>
                    <span style={{ fontWeight: "bold" }}>
                      {item.price} руб.
                    </span>
                  </div>
                ))}
                <h3>
                  Итого: {cart.reduce((sum, i) => sum + Number(i.price), 0)}{" "}
                  руб.
                </h3>
                <br />
                <button className="btn" onClick={() => changeView("checkout")}>
                  Перейти к оформлению
                </button>
              </div>
            )}
          </div>
        )}

        {view === "checkout" && (
          <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2>Оформление заказа</h2>
            <form
              onSubmit={handleOrderSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <div>
                <label>Ваше ФИО:</label>
                <br />
                <input
                  type="text"
                  required
                  style={{ width: "100%", padding: "8px" }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label>Телефон:</label>
                <br />
                <input
                  type="text"
                  required
                  style={{ width: "100%", padding: "8px" }}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label>Адрес доставки:</label>
                <br />
                <textarea
                  required
                  style={{ width: "100%", padding: "8px" }}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn">
                Подтвердить заказ
              </button>
            </form>
          </div>
        )}

        {view === "success" && (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2 style={{ color: "green" }}>Спасибо за заказ!</h2>
            <p style={{ marginTop: "10px" }}>Заказ успешно оформлен.</p>
            <br />
            <button className="btn" onClick={() => changeView("catalog")}>
              В каталог
            </button>
          </div>
        )}

        {view === "analytics" && (
          <div className="dashboard">
            <h2>Дашборд визуального анализа воронки</h2>
            <p style={{ color: "#777", marginBottom: "20px" }}>
              Аналитика поведения пользователей (TypeScript)
            </p>

            {analyticsData.length === 0 ? (
              <p>Нет данных. Совершите пару тестовых действий в магазине!</p>
            ) : (
              analyticsData.map((row, index) => {
                const maxUsers = Math.max(
                  ...analyticsData.map((d) => Number(d.unique_users)),
                  1,
                );
                const percent = Math.round(
                  (Number(row.unique_users) / maxUsers) * 100,
                );
                return (
                  <div key={index} className="funnel-step">
                    <span style={{ width: "180px", fontWeight: "bold" }}>
                      {row.step_name}
                    </span>
                    <div className="funnel-bar-bg">
                      <div
                        className="funnel-bar-fill"
                        style={{ width: `${percent}%` }}
                      >
                        {row.unique_users} сесс.
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
