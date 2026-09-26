import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../shared/api";
import type { Product } from "../catalog/CatalogView";

interface ProductForm {
  name: string;
  price: string;
  image_url: string;
  category: string;
}

const emptyForm: ProductForm = {
  name: "",
  price: "",
  image_url: "",
  category: "",
};

const getErrorMessage = async (response: Response) => {
  const body: unknown = await response.json().catch(() => null);
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `Ошибка сервера (${response.status})`;
};

export const AdminProductsView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    apiFetch("/api/products")
      .then(async (response) => {
        if (!response.ok) throw new Error(await getErrorMessage(response));
        const data: Product[] = await response.json();
        if (isMounted) setProducts(data);
      })
      .catch((loadError: unknown) => {
        console.error("Admin product list request failed:", loadError);
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить товары",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadProducts = useCallback(async () => {
    setError("");
    try {
      const response = await apiFetch("/api/products");
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (loadError) {
      console.error("Admin product list request failed:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить товары",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(
        editingId === null ? "/api/products" : `/api/products/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, price: Number(form.price) }),
        },
      );
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setNotice(editingId === null ? "Товар добавлен." : "Изменения сохранены.");
      resetForm();
      setLoading(true);
      await loadProducts();
    } catch (saveError) {
      console.error("Product save failed:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить товар",
      );
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      image_url: product.image_url,
      category: product.category,
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return;
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      if (editingId === product.id) resetForm();
      setNotice("Товар удалён.");
      setLoading(true);
      await loadProducts();
    } catch (deleteError) {
      console.error("Product deletion failed:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить товар",
      );
    }
  };

  return (
    <section className="mx-auto my-8 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Панель администратора
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Управление товарами</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold text-slate-900 sm:col-span-2">
          {editingId === null ? "Добавить товар" : "Редактировать товар"}
        </h2>
        <label className="text-sm font-medium text-slate-700">
          Название
          <input
            required
            maxLength={200}
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Категория
          <input
            required
            maxLength={100}
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Цена, руб.
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm({ ...form, price: event.target.value })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Ссылка на изображение
          <input
            required
            maxLength={2048}
            value={form.image_url}
            onChange={(event) =>
              setForm({ ...form, image_url: event.target.value })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-emerald-700 sm:col-span-2">
            {notice}
          </p>
        )}
        <div className="flex gap-3 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {saving
              ? "Сохраняем..."
              : editingId === null
                ? "Добавить товар"
                : "Сохранить"}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-white"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Товары</h2>
      {loading ? (
        <p className="py-8 text-center text-slate-500">Загрузка товаров...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Категория</th>
                <th className="px-4 py-3 font-medium">Цена</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {Number(product.price).toLocaleString("ru-RU")} руб.
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editProduct(product)}
                        className="rounded-lg px-3 py-1.5 font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => void deleteProduct(product)}
                        className="rounded-lg px-3 py-1.5 font-medium text-red-700 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Товаров пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
