import {
  ArrowRight,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

const highlights = [
  { icon: ShoppingBag, label: "Техника на каждый день" },
  { icon: Search, label: "Удобный поиск товаров" },
  { icon: SlidersHorizontal, label: "Подбор по параметрам" },
];

export const HomeView = () => (
  <section className="flex min-w-0 flex-1 flex-col items-center justify-center w-full px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
    <div className="relative mx-auto flex w-[calc(100vw-4rem)] min-w-0 max-w-3xl flex-col items-center text-center sm:w-full">
      <p className="mb-5 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
        Northstar Market
      </p>
      <h1 className="w-full min-w-0 max-w-full text-2xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
        Техника, которая делает жизнь проще
      </h1>
      <p className="mt-5 w-full max-w-2xl text-sm leading-6 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
        Выбирайте электронику и оборудование для дома, работы и повседневных
        задач.
      </p>
      <Link
        to="/catalog"
        className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        Перейти в каталог <ArrowRight size={18} />
      </Link>
      <ul className="mt-10 grid w-full gap-3 sm:mt-14 sm:grid-cols-3">
        {highlights.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-4 text-sm font-medium text-slate-700 shadow-sm sm:px-4"
          >
            <Icon size={18} className="shrink-0 text-sky-600" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  </section>
);
