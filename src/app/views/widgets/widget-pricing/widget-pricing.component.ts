import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// CoreUI
import { CardModule, ButtonModule, FormModule, GridModule, AlertModule, BadgeModule } from '@coreui/angular';
import { ChartjsModule } from '@coreui/angular-chartjs';

import { PricingService, ModelPricing } from '../../../services/pricing.service';
import { IconModule } from '@coreui/icons-angular';

type Mode = 'byModel' | 'byFamily';
type Metric = 'input' | 'output';

@Component({
  selector: 'app-pricing-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // CoreUI
    GridModule, CardModule, ButtonModule, FormModule, AlertModule, BadgeModule, IconModule,
    ChartjsModule
  ],
  templateUrl: './widget-pricing.component.html'
})
export class PricingWidgetComponent implements OnInit {
  // Estado UI
  mode: Mode = 'byFamily';
  metric: Metric = 'input';
  selectedFamily = 'all';
  topN = 10;

  // Datos
  all: ModelPricing[] = [];
  families: string[] = [];

  // Chart
  data: any = { labels: [], datasets: [] };
  options: any = {
    responsive: true,
    plugins: { legend: { display: true }, tooltip: { enabled: true } },
    scales: { x: { display: true }, y: { display: true } }
  };

  loading = false;
  error?: string;

  constructor(private pricing: PricingService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.pricing.getAll(true).subscribe({
      next: (res) => {
        this.loading = false;
        this.all = res;
        this.families = Array.from(new Set(res.map(r => (r.family || 'otros').toLowerCase()))).sort();
        this.rebuild();
      },
      error: (err) => {
        this.loading = false;
        this.error = typeof err?.error === 'string' ? err.error : 'No se pudieron cargar los precios.';
      }
    });
  }

  rebuild() {
    if (this.mode === 'byFamily') {
      this.buildByFamily();
    } else {
      this.buildByModel();
    }
  }

  private buildByModel() {
    // Filtra LLM (con input/output) y por familia si procede
    const fam = this.selectedFamily.toLowerCase();
    const rows = this.all.filter(m =>
      m.price_input_per_mtok != null && m.price_output_per_mtok != null &&
      (fam === 'all' ? true : (m.family || 'otros').toLowerCase() === fam)
    );

    // Orden por métrica ascendente
    const metricKey = this.metric === 'input' ? 'price_input_per_mtok' : 'price_output_per_mtok';
    const sorted = rows.sort((a, b) => (Number(a[metricKey] ?? 0) - Number(b[metricKey] ?? 0))).slice(0, this.topN);

    this.data = {
      labels: sorted.map(m => `${m.model_name}${m.tier ? ' (' + m.tier + ')' : ''}`),
      datasets: [
        {
          label: this.metric === 'input' ? 'Input $/1M tokens' : 'Output $/1M tokens',
          data: sorted.map(m => Number(m[metricKey] ?? 0)),
          borderWidth: 1
        }
      ]
    };
  }

  private buildByFamily() {
    // Media por familia (solo LLM input/output)
    const famMap = new Map<string, { sumIn: number; sumOut: number; countIn: number; countOut: number }>();

    this.all.forEach(m => {
      const fam = (m.family || 'otros').toLowerCase();
      if (m.price_input_per_mtok == null && m.price_output_per_mtok == null) return;

      const agg = famMap.get(fam) || { sumIn: 0, sumOut: 0, countIn: 0, countOut: 0 };
      if (m.price_input_per_mtok != null) { agg.sumIn += Number(m.price_input_per_mtok); agg.countIn += 1; }
      if (m.price_output_per_mtok != null) { agg.sumOut += Number(m.price_output_per_mtok); agg.countOut += 1; }
      famMap.set(fam, agg);
    });

    const entries = Array.from(famMap.entries())
      .map(([fam, a]) => ({
        family: fam,
        avgIn: a.countIn ? a.sumIn / a.countIn : null,
        avgOut: a.countOut ? a.sumOut / a.countOut : null
      }))
      .sort((a, b) => (a.family.localeCompare(b.family)));

    this.data = {
      labels: entries.map(e => e.family),
      datasets: [
        {
          label: 'Avg Input $/1M',
          data: entries.map(e => e.avgIn ?? 0),
          borderWidth: 1
        },
        {
          label: 'Avg Output $/1M',
          data: entries.map(e => e.avgOut ?? 0),
          borderWidth: 1
        }
      ]
    };
  }

  // Helpers
  onModeChange(val: Mode) { this.mode = val; this.rebuild(); }
  onMetricChange(val: Metric) { this.metric = val; this.rebuild(); }
  onFamilyChange() { this.rebuild(); }
  onTopNChange() { this.rebuild(); }
}
