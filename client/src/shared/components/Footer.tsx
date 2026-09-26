import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="flex w-full justify-center border-t border-slate-200 bg-white px-4 py-6 md:px-8">
    <div className="flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
      <Link
        to="/"
        className="text-sm font-semibold tracking-tight text-slate-700 transition hover:text-sky-700"
      >
        Northstar Market
      </Link>
      <p className="text-xs text-slate-500">
        © {new Date().getFullYear()} Northstar Market
      </p>
    </div>
  </footer>
);
