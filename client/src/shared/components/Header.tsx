import {
  BarChart2,
  Home,
  LogOut,
  ShoppingCart,
  Users,
  Store,
  Package,
  ClipboardList,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
  user: { email: string; role: string } | null;
  cartCount: number;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-sky-50 text-sky-700 font-semibold"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export const Header = ({
  user,
  cartCount,
  onNavigate,
  onLogout,
}: HeaderProps) => (
  <header className="sticky top-0 z-50 flex w-full justify-center border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-8">
    <div className="flex w-full max-w-7xl items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20 transition group-hover:bg-sky-700">
          <Store size={22} />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition">
            Northstar Market
          </span>
          <span className="text-xs font-medium text-slate-500">
            Техника для жизни
          </span>
        </div>
      </Link>

      <nav
        aria-label="Основная навигация"
        className="flex items-center gap-2.5"
      >
        <NavLink to="/" className={navClassName}>
          <Home size={17} /> Главная
        </NavLink>

        <NavLink to="/catalog" className={navClassName}>
          <Store size={17} /> Каталог
        </NavLink>

        {user && user.role !== "admin" && (
          <NavLink to="/cart" className={navClassName}>
            <ShoppingCart size={17} /> Корзина
            {cartCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-xs font-bold text-white shadow-sm">
                {cartCount}
              </span>
            )}
          </NavLink>
        )}

        {(user?.role === "admin" || user?.role === "analyst") && (
          <NavLink to="/analytics" className={navClassName}>
            <BarChart2 size={17} /> Аналитика
          </NavLink>
        )}

        {user?.role === "admin" && (
          <>
            <NavLink to="/admin/products" className={navClassName}>
              <Package size={17} /> Товары
            </NavLink>
            <NavLink to="/admin/orders" className={navClassName}>
              <ClipboardList size={17} /> Заказы
            </NavLink>
            <NavLink to="/users" className={navClassName}>
              <Users size={17} /> Пользователи
            </NavLink>
          </>
        )}

        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />

        {user ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-inner">
            <div className="flex flex-col text-left">
              <span className="max-w-35 truncate text-xs font-semibold text-slate-800">
                {user.email}
              </span>
              <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                {user.role}
              </span>
            </div>
            <button
              onClick={onLogout}
              aria-label="Выйти"
              title="Выйти"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-400 border border-slate-200 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:border-red-100"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
            onClick={() => onNavigate("auth")}
          >
            Войти / Регистрация
          </button>
        )}
      </nav>
    </div>
  </header>
);
