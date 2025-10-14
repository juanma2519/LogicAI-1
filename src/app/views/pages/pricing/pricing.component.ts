import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PricingService, ModelPricing } from '../../../services/pricing.service';
import { ContainerComponent, ButtonDirective, RowComponent, CardComponent, PopoverModule, PopoverDirective, TableModule, UtilitiesModule, InputGroupTextDirective } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';
import { LeadFormComponent } from '../leeds-form/leeds-form.component';
import { PricingWidgetComponent } from '../../widgets/widget-pricing/widget-pricing.component';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [PricingWidgetComponent, ContainerComponent, FormsModule, ButtonDirective, WidgetsBrandComponent, WidgetsDemoComponent, RowComponent, CardComponent,
       LeadFormComponent, ReactiveFormsModule, PopoverModule, PopoverDirective, IconModule, TableModule, UtilitiesModule, InputGroupTextDirective, IconDirective, CommonModule],
  templateUrl: './pricing.component.html'
})
export class PricingPageComponent implements OnInit {
  all: ModelPricing[] = [];
  view: ModelPricing[] = [];
  loading = false;
  error?: string;

  q = '';
  family = 'all';

  families: string[] = [];

  constructor(private pricing: PricingService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.pricing.getAll(true).subscribe({
      next: (data) => {
        this.loading = false;
        this.all = data;
        this.families = Array.from(new Set((data.map(d => (d.family || 'otros').toLowerCase())))).sort();
        this.applyFilters();
      },
      error: (err) => {
        this.loading = false;
        this.error = typeof err?.error === 'string' ? err.error : 'No se pudieron cargar los precios.';
      }
    });
  }

  applyFilters() {
    const q = this.q.trim().toLowerCase();
    const fam = this.family.toLowerCase();

    this.view = this.all.filter(m => {
      const matchFam = fam === 'all' ? true : (m.family || 'otros').toLowerCase() === fam;
      const hay = (m.model_name + ' ' + (m.tier || '') + ' ' + (m.family || '')).toLowerCase();
      const matchQ = q ? hay.includes(q) : true;
      return matchFam && matchQ;
    }).sort((a, b) =>
      (a.family || '').localeCompare(b.family || '') ||
      (a.tier || '').localeCompare(b.tier || '') ||
      (a.model_name).localeCompare(b.model_name)
    );
  }

  priceIO(m: ModelPricing) {
    const inp = m.price_input_per_mtok != null ? `$${m.price_input_per_mtok}` : '-';
    const out = m.price_output_per_mtok != null ? `$${m.price_output_per_mtok}` : '-';
    return `${inp} / ${out}`;
  }
}
