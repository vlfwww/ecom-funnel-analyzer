import React, { useMemo, useState } from "react";

export interface Product {
  id: number | string;
  name: string;
  price: number | string;
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );
  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ru");
    return products
      .filter((product) => {
        const matchesSearch =
          !normalizedSearch ||
          `${product.name} ${product.category}`
            .toLocaleLowerCase("ru")
            .includes(normalizedSearch);
        return (
          matchesSearch && (category === "all" || product.category === category)
        );
      })
      .sort((first, second) => {
        if (sort === "price-asc") return Number(first.price) - Number(second.price);
        if (sort === "price-desc") return Number(second.price) - Number(first.price);
        if (sort === "name-desc") return second.name.localeCompare(first.name, "ru");
        return first.name.localeCompare(second.name, "ru");
      });
  }, [category, products, search, sort]);

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Northstar Market
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Каталог оборудования и электроники
        </h1>
        <p className="mt-3 text-slate-500">
          Подберите технику, которая делает каждый день удобнее.
        </p>
      </div>
      <div className="mx-auto mb-8 grid max-w-5xl gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <label className="text-left text-sm font-medium text-slate-700">
          Поиск по товарам
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Название или категория"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        <label className="text-left text-sm font-medium text-slate-700">
          Категория
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            <option value="all">Все категории</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-left text-sm font-medium text-slate-700">
          Сортировка
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            <option value="name-asc">По названию: А—Я</option>
            <option value="name-desc">По названию: Я—А</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((prod) => (
          <div
            key={prod.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <img
                src={prod.image_url}
                alt={prod.name}
                className="mb-5 h-48 w-full rounded-2xl bg-slate-50 p-3 object-contain"
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
                {Number(prod.price).toLocaleString("ru-RU")} руб.
              </p>
              <button
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                onClick={() => onSelectProduct(prod)}
              >
                Подробнее
              </button>
            </div>
          </div>
        ))}
      </div>
      {visibleProducts.length === 0 && (
        <p className="mx-auto mt-2 max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
          По вашему запросу товары не найдены.
        </p>
      )}
    </div>
  );
};
