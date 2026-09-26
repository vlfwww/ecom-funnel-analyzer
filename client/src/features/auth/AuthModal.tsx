import React, { useState } from "react";
import { API_URL, setAccessToken } from "../../shared/api";

interface AuthModalProps {
  onLoginSuccess: (user: { email: string; role: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && typeof data.accessToken === "string") {
        setAccessToken(data.accessToken);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || "Не удалось выполнить вход");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        {isLogin ? "Вход в систему" : "Регистрация аккаунта"}
      </h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Email:
          </label>
          <input
            type="email"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Пароль:
          </label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {!isLogin && (
          <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Новый аккаунт получит роль клиента. Учётные записи администраторов
            создаются отдельно через базу данных.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      <p
        className="mt-6 cursor-pointer text-center text-sm text-slate-500 transition hover:text-sky-700"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin
          ? "Нет аккаунта? Зарегистрируйтесь"
          : "Уже есть аккаунт? Войдите"}
      </p>
    </div>
  );
};
