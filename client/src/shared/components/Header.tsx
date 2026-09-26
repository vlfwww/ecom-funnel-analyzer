import React from "react";
import { ShoppingCart, BarChart2, Home, LogOut, User } from "lucide-react";

interface HeaderProps {
  user: { email: string; role: string } | null;
  cartCount: number;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  cartCount,
  onNavigate,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur md:px-8">
      <div
        className="flex cursor-pointer items-center gap-3"
        onClick={() => onNavigate("catalog")}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-lg font-bold text-sky-700">
          N
        </span>
        <span>
          <span className="block text-lg font-bold tracking-tight text-slate-900">
            Northstar Market
          </span>
          <span className="block text-xs text-slate-500">
            {user ? `Роль: ${user.role}` : "Техника для жизни"}
          </span>
        </span>
      </div>

      <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end md:gap-3">
        <button
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
          onClick={() => onNavigate("catalog")}
        >
          <Home size={16} /> Каталог
        </button>

        {(!user || user.role === "client") && (
          <button
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
            onClick={() => onNavigate("cart")}
          >
            <ShoppingCart size={16} /> Корзина ({cartCount})
          </button>
        )}

        {(user?.role === "admin" || user?.role === "analyst") && (
          <button
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
            onClick={() => onNavigate("analytics")}
          >
            <BarChart2 size={16} /> Дашборд воронки
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <User size={16} className="text-sky-600" />
            <span className="text-sm text-slate-700">{user.email}</span>
            <button
              onClick={onLogout}
              aria-label="Выйти"
              className="ml-1 text-slate-400 transition hover:text-red-500"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            onClick={() => onNavigate("auth")}
          >
            Войти / Регистрация
          </button>
        )}
      </div>
    </header>
  );
};
