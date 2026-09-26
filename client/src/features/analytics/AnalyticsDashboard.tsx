import React from "react";

interface FunnelRow {
  step_name: string;
  unique_users: string | number;
}

interface AnalyticsDashboardProps {
  data: FunnelRow[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  return (
    <section className="mx-auto my-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h1 className="mb-7 text-center text-2xl font-bold text-slate-900">
        Аналитика воронки
      </h1>

      {data.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-6 py-10 text-center text-slate-500">
          Данных пока нет.
        </p>
      ) : (
        <div className="space-y-6">
          {data.map((row, index) => {
            const maxUsers = Math.max(
              ...data.map((d) => Number(d.unique_users)),
              1,
            );
            const percent = Math.round(
              (Number(row.unique_users) / maxUsers) * 100,
            );
            return (
              <div key={index} className="flex items-center gap-4">
                <span className="w-44 text-sm font-semibold text-slate-700">
                  {row.step_name}
                </span>
                <div className="h-8 flex-1 overflow-hidden rounded-lg bg-slate-100 p-1">
                  <div
                    className="flex h-full items-center rounded-md bg-sky-600 px-3 text-xs font-bold text-white transition-all duration-500"
                    style={{ width: `${Math.max(percent, 8)}%` }}
                  >
                    {row.unique_users} сесс.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
