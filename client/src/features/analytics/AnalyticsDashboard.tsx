import React from "react";

interface FunnelRow {
  step_name: string;
  unique_users: string | number;
}

interface AnalyticsDashboardProps {
  data: FunnelRow[];
  role: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  role,
}) => {
  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">
        Дашборд визуального анализа воронки
      </h2>
      <p className="text-sm text-slate-500 mb-8">
        Текущая роль доступа:{" "}
        <span className="font-semibold text-sky-700">{role}</span>
      </p>

      {data.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          Пока нет данных трекинга. Сделайте несколько переходов в каталоге!
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
    </div>
  );
};
