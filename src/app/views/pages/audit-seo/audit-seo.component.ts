import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccordionButtonDirective, AccordionItemComponent, AccordionModule, AlertModule, AvatarComponent, BadgeComponent, ButtonDirective, ButtonGroupComponent, ButtonModule, CardBodyComponent, CardComponent, CardFooterComponent, CardGroupComponent, CardHeaderComponent, CardModule, ColComponent, ContainerComponent, FormCheckLabelDirective, FormDirective, GridModule, GutterDirective, InputGroupComponent, InputGroupTextDirective, ModalModule, PaginationModule, PopoverDirective, PopoverModule, ProgressComponent, RowComponent, TableDirective, TableModule, Tabs2Module, TabsComponent, TabsModule, TemplateIdDirective, UtilitiesModule } from '@coreui/angular';
import { ChartjsComponent, ChartjsModule } from '@coreui/angular-chartjs';
import { IconDirective, IconModule } from '@coreui/icons-angular';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { N8nService } from '../../../services/n8n.service';
import { PricingWidgetComponent } from '../../widgets/widget-pricing/widget-pricing.component';
import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDemoComponent } from '../../widgets/widgets-demo/widgets-demo.component';
import { WidgetsDropdownComponent } from '../../widgets/widgets-dropdown/widgets-dropdown.component';
import { DataResponse, SeoAuditEstado, SeoAuditItem } from '../../../models/dataResponse';
import { LeadFormComponent } from '../leeds-form/leeds-form.component';
import { AgentSettingsComponent } from '../agent-settings/agent-settings.component';

type ChartData = {
  labels: string[];
  datasets: Array<{ data: number[]; label?: string }>;
};

@Component({
  selector: 'app-audit-seo',
  templateUrl: './audit-seo.component.html',
  imports: [
    ReactiveFormsModule,
    CommonModule,

    // CoreUI Angular
    TabsComponent,
    CardComponent,
    ProgressComponent,
    BadgeComponent,
    ButtonDirective,
    IconModule,
    WidgetsDemoComponent,
    PricingWidgetComponent,
    WidgetsDropdownComponent,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    ReactiveFormsModule,
    ButtonGroupComponent,
    FormCheckLabelDirective,
    ChartjsComponent,
    NgStyle,
    CardFooterComponent,
    GutterDirective,
    ProgressComponent,
    WidgetsBrandComponent,
    CardHeaderComponent,
    TableDirective,
    AvatarComponent,
    Tabs2Module,
    ChartjsModule,
    AccordionModule,
    AccordionItemComponent,
    TemplateIdDirective,
    AccordionButtonDirective,
    AgentSettingsComponent,
        GridModule, CardModule, ButtonModule, AlertModule,
    PaginationModule, ContainerComponent, FormsModule, CardGroupComponent, FormDirective,
    ModalModule, InputGroupComponent, LeadFormComponent, PopoverModule, PopoverDirective, IconModule, TableModule, UtilitiesModule, InputGroupTextDirective, IconDirective]
})
export class AuditSeoComponent implements OnInit, OnDestroy {

  scraps: SeoAuditItem[] = [];
  scrapsFiltrados: SeoAuditItem[] = [];
  scrapSelected: SeoAuditItem | null = null;
  detailVisible: boolean = false;
  form!: FormGroup;
  loading = false;
  progress = 0;
  urlAnalizada: string | null = null;
  // props de paginación
  page = 1;
  pageSize = 10;
  filtroEstadoId: SeoAuditEstado | null = null;
  Math = Math;
  // Datos crudos
  data: DataResponse | null = null;

  // Vistas
  scores?: { performance: number; accessibility: number; best_practices: number; seo: number; pwa: number | null };
  kpis?: { LCP_ms: number | null; CLS: number | null; TBT_ms: number | null; INP_ms: number | null; FCP_ms: number | null };
  totales?: { errores: number; warnings: number; oportunidades: number };
  topRisks: DataResponse['summary']['top_risks'] = [];
  hallazgos: DataResponse['hallazgos_unificados'] = [];
  recomendaciones = [] as NonNullable<DataResponse['recomendaciones_ia']>;
  quickWins = [] as NonNullable<DataResponse['quick_wins']>;
  nextSteps = [] as NonNullable<DataResponse['next_steps']>;
  summary: DataResponse["summary"] = ({
    totales: { errores: 0, warnings: 0, oportunidades: 0 },
    lighthouse_scores: { performance: 0, accessibility: 0, best_practices: 0, seo: 0, pwa: null },
    kpis: { LCP_ms: null, CLS: null, TBT_ms: null, INP_ms: null, FCP_ms: null },
    top_risks: []
  });;

  headings?: { h1: number, h2: number, h3: number, samples: { h1: string[], h2: string[], h3: string[] } };
  links?: { internal: number, external: number, total: number, samples: { internal: string[], external: string[] } };
  word_count?: number;
  top_words?: [string, number][];
  // Charts
  charts: {
    options: any;
    barOptions: any;
    scoresBar: ChartData;
    kpisBar: ChartData;
    totalesPie: ChartData;
  } | null = null;

  sprintGroups: Array<{
    key: string;          // "Sprint 1", "Sprint 2", "Otros", etc.
    index?: number;       // 1, 2, ...
    items: Array<{
      titulo: string;
      tareas: string[];
      owner?: string;
      kpi?: string;
      criterios_aceptacion?: string[];
    }>;
  }> = [];

  private sub?: Subscription;

  // Ajusta de dónde tomas el usuario (auth service, etc.)
  private userId = Number(localStorage.getItem('userId'));

  constructor(
    private fb: FormBuilder,
    private webhokService: N8nService,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({ url: ['', [Validators.required]] });
    this.cargarScraps();
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private cargarScraps(): void {
    this.loading = true;
    this.webhokService
      .getScraps(this.userId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((scraps: any) => {
        this.scraps = scraps;
        for (let index = 0; index < this.scraps.length; index++) {
          this.scraps[index].payload_json = JSON.parse(this.scraps[index].payload_json.toString());
          this.scraps[index].errores = this.scraps[index].payload_json.summary.totales.errores;
          this.scraps[index].warnings = this.scraps[index].payload_json.summary.totales.warnings;
          this.scraps[index].oportunidades = this.scraps[index].payload_json.summary.totales.oportunidades;
        }
        this.aplicarFiltros();
      });
    this.resetPagination();
  }

  analyze(): void {
    if (this.form.invalid) return;
    const url = (this.form.value.url as string).trim();
    if (!url) return;

    this.reset();
    this.urlAnalizada = url;
    
    this.sub = this.webhokService.puppeter(url, this.userId, 0)
      .pipe(
        catchError(err => {
          console.error('[AuditSEO] Error:', err);
          this.loading = false;
          this.progress = 0;
          return of(null);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe((resp: DataResponse | null) => {
        
      });
  }

  // === Helpers ===
  private reset() {
    this.loading = true;
    this.progress = 10;
    this.data = null;
    this.charts = null;
    this.totales = undefined;
    this.scores = undefined;
    this.kpis = undefined;
    this.topRisks = [];
    this.hallazgos = [];
    this.recomendaciones = [];
    this.quickWins = [];
    this.nextSteps = [];
  }

  private groupNextSteps(nextSteps: any[] = []) {
    const map = new Map<string, { key: string; index?: number; items: any[] }>();

    for (const step of nextSteps) {
      // Ejemplo título: "Sprint 2: Optimización de CSS"
      const m = (step.titulo || '').match(/sprint\s*(\d+)/i);
      const idx = m ? Number(m[1]) : undefined;
      const key = m ? `Sprint ${idx}` : 'Otros';

      if (!map.has(key)) {
        map.set(key, { key, index: idx, items: [] });
      }
      map.get(key)!.items.push(step);
    }

    // Ordenar por número de sprint; "Otros" al final
    this.sprintGroups = Array.from(map.values())
      .sort((a, b) => {
        if (a.index == null && b.index == null) return 0;
        if (a.index == null) return 1;
        if (b.index == null) return -1;
        return a.index - b.index;
      });
  }


  private buildCharts(
    totales?: { errores: number; warnings: number; oportunidades: number },
    scores?: { performance: number; accessibility: number; best_practices: number; seo: number; pwa: number | null },
    kpis?: { LCP_ms: number | null; CLS: number | null; TBT_ms: number | null; INP_ms: number | null; FCP_ms: number | null }
  ) {
    const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
    const barOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    const scoresBar: ChartData = {
      labels: ['Performance', 'Accessibility', 'Best practices', 'SEO'],
      datasets: [{ data: [scores?.performance ?? 0, scores?.accessibility ?? 0, scores?.best_practices ?? 0, scores?.seo ?? 0] }]
    };

    const kpisBar: ChartData = {
      labels: ['LCP (ms)', 'FCP (ms)', 'TBT (ms)', 'INP (ms)', 'CLS (x1000)'],
      datasets: [{
        data: [
          kpis?.LCP_ms ?? 0,
          kpis?.FCP_ms ?? 0,
          kpis?.TBT_ms ?? 0,
          kpis?.INP_ms ?? 0,
          (kpis?.CLS ?? 0) * 1000 // para visualizar mejor CLS
        ]
      }]
    };

    const totalesPie: ChartData = {
      labels: ['Errores', 'Warnings', 'Oportunidades'],
      datasets: [{ data: [totales?.errores ?? 0, totales?.warnings ?? 0, totales?.oportunidades ?? 0] }]
    };

    return { options, barOptions, scoresBar, kpisBar, totalesPie };
  }


  getWordPercentage(frequency: any, totalWords: number | undefined): string {
    const freq = Number(frequency) || 0;
    const total = totalWords || 1;
    return ((freq / total) * 100).toFixed(2);
  }

  aplicarFiltros(): void {
    this.scrapsFiltrados = this.scraps.filter((l) => {
      const estadoId = l.status || null;
      const passEstado = this.filtroEstadoId ? estadoId === this.filtroEstadoId : true;
      return passEstado;
    });
    this.resetPagination();
  }

  private resetPagination() {
    this.page = 1;
  }

  // utilidades
  goTo(p: number) {
    this.page = Math.min(Math.max(1, p), this.totalPages);
  }
  onPageSizeChange(ps: number) {
    this.pageSize = +ps;
    this.page = 1;
  }
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  mostrarDesde() {
    return this.totalItems === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }
  mostrarHasta() {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  // si ya tienes leadsFiltrados, úsalo tal cual; aquí solo derivamos el “slice”
  get baseList(): any[] {
    return (this.scrapsFiltrados && this.scrapsFiltrados.length > 0)
      ? this.scrapsFiltrados
      : (this.scraps || []);
  }

  get totalItems(): number {
    return this.baseList.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }
  get pagedLeads(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.baseList.slice(start, start + this.pageSize);
  }

  totalesOf(s: any) {
    return s?.payload_json?.summary?.totales || null;
  }

  estadoBadgeClass(estado?: string) {
    const e = (estado || '').toLowerCase();
    return {
      'text-bg-warning': e === 'pendiente',
      'text-bg-success': e === 'completado',
      'text-bg-danger': e === 'error',
      'text-bg-secondary': !e
    };
  }

  // Acción de detalle (abre tu modal y carga el detalle)
  verDetalle(s: any) {
    this.scrapSelected = s;         // guarda el scraping seleccionado
    if (!this.scrapSelected) return;
        this.data = this.scrapSelected.payload_json;

        // Mapear a props de vista
        this.totales = this.data?.summary?.totales;
        this.scores = this.data?.summary?.lighthouse_scores;
        this.kpis = this.data?.summary?.kpis;
        this.topRisks = this.data?.summary?.top_risks ?? [];
        this.hallazgos = this.data?.hallazgos_unificados ?? [];
        this.recomendaciones = this.data?.recomendaciones_ia ?? [];
        this.quickWins = this.data?.quick_wins ?? [];
        this.nextSteps = this.data?.next_steps ?? [];
        this.summary = this.data?.summary || {
    totales: { errores: 0, warnings: 0, oportunidades: 0 },
    lighthouse_scores: { performance: 0, accessibility: 0, best_practices: 0, seo: 0, pwa: null },
    kpis: { LCP_ms: null, CLS: null, TBT_ms: null, INP_ms: null, FCP_ms: null },
    top_risks: []
  };
        this.headings = this.data?.headings;
        this.word_count = this.data?.word_count;
        this.top_words = this.top_words;
        this.groupNextSteps(this.nextSteps);

        // Charts
        this.charts = this.buildCharts(this.totales, this.scores, this.kpis);
        this.progress = 100;
    this.detailVisible = true; // muestra el modal (ya con el HTML que montamos antes)
  }

  closeGenerateModal() {
    this.detailVisible = false;
  }

  // (Opcional) Reintentar si falló
  reintentar(s: any) {
    // llama a tu servicio para re-lanzar el scraping
  }

  // Formateos para plantilla
  ms(n?: number | null) { return n ?? 0; }
  toSec(n?: number | null) { return ((n ?? 0) / 1000).toFixed(2); }
}