import React from "react";
import { type Product } from "../catalog/CatalogView";

interface CartViewProps {
  cart: Product[];
  onCheckout: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ cart, onCheckout }) => {
  const totalPrice = cart.reduce((sum, i) => sum + Number(i.price), 0);

  return (
    <section className="mx-auto my-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h1 className="mb-7 text-center text-2xl font-bold text-slate-900">
        Корзина
      </h1>
      {cart.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">Ваша корзина пуста</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <span className="font-medium text-slate-800">{item.name}</span>
              <span className="font-bold text-slate-900">
                {item.price} руб.
              </span>
            </div>
          ))}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-lg font-bold text-slate-700">Итого:</span>
            <span className="text-xl font-extrabold text-sky-700">
              {totalPrice} руб.
            </span>
          </div>
          <button
            className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700"
            onClick={onCheckout}
          >
            Перейти к оформлению заказа
          </button>
        </div>
      )}
    </section>
  );
};
