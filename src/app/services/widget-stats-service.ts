// src/app/core/usage/widget-stats.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

type ByKey = Array<{ demo_key: string; count: number }>;
type ByDay = Array<{ day: string; demo_key: string; count: number }>;

export interface UserUsageSummary {
  total: number;
  byDemo: ByKey;
  byDay: ByDay;     // últimos 60 días (según backend)
  byMonth: Array<{ month: string; demo_key: string; count: number }>;
}
export interface AdminUsageSummary {
  total: number;
  byDemo: ByKey;
  byDay: Array<{ day: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  byUser: Array<{ usuario_id: number; count: number }>;
}

export interface WidgetStats {
  // texto principal del widget (ej: "26K")
  valueText: string;
  // porcentaje (ej: -12.4)
  deltaPercent: number;
  // dataset + labels para <c-chart type="line">
  chartData: any;
  chartOptions: any;
}

@Injectable({ providedIn: 'root' })
export class WidgetStatsService {
  private base = `${environment.apiUrl}/usage`;

  constructor(private http: HttpClient) {}

  /** Stats para un usuario (widget del cliente) */
  getUserWidgetStats(userId: number | string, demoKeyFilter?: string) {
    return this.http.get<UserUsageSummary>(`${this.base}/user/${userId}/summary`).pipe(
      map((s) => this.buildWidgetStatsFromUserSummary(s, demoKeyFilter))
    );
  }

  /** Stats globales (widget del admin) */
  getAdminWidgetStats() {
    return this.http.get<AdminUsageSummary>(`${this.base}/admin/summary`).pipe(
      map((s) => this.buildWidgetStatsFromAdminSummary(s))
    );
  }

  // ---------- Helpers de transformación ----------

  private buildWidgetStatsFromUserSummary(s: UserUsageSummary, demoKeyFilter?: string): WidgetStats {
    // 1) Serie diaria: sumamos por día, con o sin filtro por demo
    const dailyMap = new Map<string, number>(); // YYYY-MM-DD -> count
    s.byDay.forEach(r => {
      if (demoKeyFilter && r.demo_key !== demoKeyFilter) return;
      const d = r.day; // viene ya en YYYY-MM-DD desde el backend
      dailyMap.set(d, (dailyMap.get(d) || 0) + Number(r.count));
    });

    // 2) Construimos últimos 14 días (para el mini sparkline del widget)
    const { labels, values } = this.lastNDaysSeries(dailyMap, 14);

    // 3) Delta: comparamos últimos 7 vs los 7 previos
    const { deltaPercent } = this.computeDelta(values);

    // 4) Value principal: total (opcional: por demo si hay filtro)
    const total = demoKeyFilter
      ? (s.byDemo.find(d => d.demo_key === demoKeyFilter)?.count || 0)
      : s.total;

    return {
      valueText: this.kFormatter(total),
      deltaPercent,
      chartData: {
        labels,
        datasets: [
          {
            data: values,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      chartOptions: this.defaultLineOptions()
    };
  }

  private buildWidgetStatsFromAdminSummary(s: AdminUsageSummary): WidgetStats {
    // Serie diaria global
    const dailyMap = new Map<string, number>();
    s.byDay.forEach(r => {
      const d = r.day;
      dailyMap.set(d, (dailyMap.get(d) || 0) + Number(r.count));
    });

    const { labels, values } = this.lastNDaysSeries(dailyMap, 14);
    const { deltaPercent } = this.computeDelta(values);
    const total = s.total;

    return {
      valueText: this.kFormatter(total),
      deltaPercent,
      chartData: {
        labels,
        datasets: [
          { data: values, tension: 0.35, borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      chartOptions: this.defaultLineOptions()
    };
  }

  private lastNDaysSeries(map: Map<string, number>, n: number) {
    const labels: string[] = [];
    const values: number[] = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      values.push(map.get(key) || 0);
    }
    return { labels, values };
  }

  private computeDelta(values: number[]) {
    const n = values.length;
    const a = values.slice(0, n - 7).slice(-7); // semana previa
    const b = values.slice(-7);                 // última semana
    const sum = (arr: number[]) => arr.reduce((acc, v) => acc + v, 0);
    const prev = sum(a);
    const curr = sum(b);
    const deltaPercent = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
    return { deltaPercent: Math.round(deltaPercent * 10) / 10 };
  }

  private kFormatter(num: number) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return String(num);
  }

  private defaultLineOptions() {
    return {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: { x: { display: false }, y: { display: false } },
      elements: { line: { borderJoinStyle: 'round' } }
    };
  }
}
