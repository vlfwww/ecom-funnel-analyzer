import React, { useState } from "react";

interface CheckoutViewProps {
  onSubmitOrder: (formData: {
    name: string;
    phone: string;
    address: string;
  }) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  onSubmitOrder,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitOrder(formData);
  };

  return (
    <section className="mx-auto my-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h1 className="mb-7 text-center text-2xl font-bold text-slate-900">
        Оформление заказа
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            ФИО:
          </label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Телефон:
          </label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Адрес доставки:
          </label>
          <textarea
            required
            rows={3}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          Подтвердить заказ
        </button>
      </form>
    </section>
  );
};
