import React from "react";

export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

interface CatalogViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  onSelectProduct,
}) => {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Northstar Market
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Каталог оборудования и электроники
        </h2>
        <p className="mt-2 text-slate-500">
          Подберите технику, которая делает каждый день удобнее.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div>
              <img
                src={prod.image_url}
                alt={prod.name}
                className="mb-4 h-40 w-full rounded-xl bg-slate-50 p-2 object-contain"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                {prod.category}
              </span>
              <h4 className="font-medium text-slate-800 mt-1 mb-2 line-clamp-2">
                {prod.name}
              </h4>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 mb-3">
                {prod.price} руб.
              </p>
              <button
                className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                onClick={() => onSelectProduct(prod)}
              >
                Подробнее
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
