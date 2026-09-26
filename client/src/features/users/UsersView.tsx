import { useEffect, useState } from "react";
import { apiFetch } from "../../shared/api";

interface UserRecord {
  id: number | string;
  email: string;
  role: string;
  created_at: string;
}

export const UsersView = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    apiFetch("/api/users")
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Ошибка сервера (${response.status})`,
          );
        }
        const data: UserRecord[] = await response.json();
        if (isMounted) setUsers(data);
      })
      .catch((err: unknown) => {
        console.error("User list request failed:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить список пользователей.",
          );
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto my-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Northstar Market
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="mx-auto w-full min-w-xl text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {user.role}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(user.created_at).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Пользователей пока нет.
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
