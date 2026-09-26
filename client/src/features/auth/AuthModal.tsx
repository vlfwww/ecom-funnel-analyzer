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
    <section className="mx-auto my-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Northstar Market
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isLogin ? "Вход в аккаунт" : "Создание аккаунта"}
        </h1>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Электронная почта
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Пароль
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      <button
        type="button"
        className="mt-6 w-full text-center text-sm font-medium text-slate-500 transition hover:text-sky-700"
        onClick={() => {
          setIsLogin(!isLogin);
          setError("");
        }}
      >
        {isLogin
          ? "Нет аккаунта? Зарегистрируйтесь"
          : "Уже есть аккаунт? Войдите"}
      </button>
    </section>
  );
};
