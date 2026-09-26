import { useEffect, useState } from "react";
import { apiFetch } from "../../shared/api";

interface OrderRecord {
  id: number | string;
  session_uuid: string;
  total_amount: number | string;
  customer_name: string;
  phone: string;
  address: string;
  created_at?: string;
}

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

export const OrdersView = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiFetch("/api/orders")
      .then(async (response) => {
        if (!response.ok) throw new Error(await getErrorMessage(response));
        const data: OrderRecord[] = await response.json();
        if (isMounted) setOrders(data);
      })
      .catch((requestError: unknown) => {
        console.error("Order list request failed:", requestError);
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Не удалось загрузить список заказов",
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

  return (
    <section className="mx-auto my-8 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Панель администратора
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Заказы пользователей</h1>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      ) : loading ? (
        <p className="py-8 text-center text-slate-500">Загрузка заказов...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Заказ</th>
                <th className="px-4 py-3 font-medium">Покупатель</th>
                <th className="px-4 py-3 font-medium">Телефон и адрес</th>
                <th className="px-4 py-3 font-medium">Сумма</th>
                <th className="px-4 py-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    #{order.id}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.customer_name}
                  </td>
                  <td className="max-w-80 px-4 py-3 text-slate-600">
                    <div>{order.phone}</div>
                    <div className="mt-1 whitespace-normal">{order.address}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                    {Number(order.total_amount).toLocaleString("ru-RU")} руб.
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Заказов пока нет.
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
