import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "./CatalogView";

interface ProductDetailViewProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  canAddToCart: boolean;
}

export const ProductDetailView = ({
  product,
  onAddToCart,
  canAddToCart,
}: ProductDetailViewProps) => (
  <article className="mx-auto my-auto grid w-full max-w-5xl items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
    <div className="rounded-2xl bg-slate-50 p-6">
      <img
        src={product.image_url}
        alt={product.name}
        className="h-80 w-full object-contain"
      />
    </div>
    <div>
      <Link
        to="/catalog"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
      >
        <ArrowLeft size={16} /> Вернуться в каталог
      </Link>
      <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
        {product.category}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {product.name}
      </h1>
      <p className="mt-5 text-3xl font-extrabold text-slate-900">
        {Number(product.price).toLocaleString("ru-RU")} руб.
      </p>
      {canAddToCart && (
        <button
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700"
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart size={18} /> Добавить в корзину
        </button>
      )}
    </div>
  </article>
);
