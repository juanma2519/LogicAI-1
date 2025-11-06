import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { N8nService } from '../../../services/n8n.service';
import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ProgressComponent,
  RowComponent,
  SpinnerComponent,
  Tabs2Module
} from '@coreui/angular';

type AnyObj = Record<string, any>;

@Component({
  selector: 'app-email-marketing',
  templateUrl: './email-marketing.component.html',
  styleUrls: ['./email-marketing.component.scss'],
  imports: [
    CommonModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    BadgeComponent,
    ButtonDirective,
    ProgressComponent,
    SpinnerComponent,
    Tabs2Module
  ]
})
export class EmailMarketingComponent implements OnInit, AfterViewInit, OnDestroy {
  id!: number;
  loading = true;
  step = 0; // 0..3 (Answer First, Razones, Evidencia, So What?)
  progress = 0;
  Math = Math; // Exponer Math para usar en el template
  private hideElevenLabsInterval?: any;

  consultoria?: AnyObj;
  report?: AnyObj;
  meta?: AnyObj;
  summary?: AnyObj;
  totales?: AnyObj;
  scores?: AnyObj;
  kpis?: AnyObj;
  topRisks: AnyObj[] = [];
  headings?: AnyObj;
  links?: AnyObj;
  top_words: [string, number][] = [];
  hallazgos: AnyObj[] = [];
  recomendaciones: AnyObj[] = [];
  quickWins: AnyObj[] = [];
  nextSteps: AnyObj[] = [];

  constructor(
    private route: ActivatedRoute,
    private n8nService: N8nService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.fetch();
  }

  ngAfterViewInit(): void {
    // Ocultar widget de ElevenLabs inmediatamente
    setTimeout(() => {
      this.hideElevenLabsWidget();
    }, 100);
    
    // Verificar periódicamente por si se carga después (menos frecuente)
    this.hideElevenLabsInterval = setInterval(() => {
      this.hideElevenLabsWidget();
    }, 2000);
    
    // Usar MutationObserver solo para detectar nuevos elementos añadidos
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const el = node as HTMLElement;
              if (el.tagName === 'ELEVENLABS-CONVAI' || 
                  el.querySelector?.('elevenlabs-convai') ||
                  (el.tagName === 'IFRAME' && (el.getAttribute('src')?.includes('elevenlabs') || el.getAttribute('src')?.includes('convai')))) {
                shouldCheck = true;
              }
            }
          });
        }
      });
      if (shouldCheck) {
        this.hideElevenLabsWidget();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: false // Solo observar hijos directos para mejor rendimiento
    });
    
    // Guardar referencia para limpiar en ngOnDestroy
    (this as any).elevenLabsObserver = observer;
  }

  ngOnDestroy(): void {
    if (this.hideElevenLabsInterval) {
      clearInterval(this.hideElevenLabsInterval);
    }
    if ((this as any).elevenLabsObserver) {
      (this as any).elevenLabsObserver.disconnect();
    }
  }

  private hideElevenLabsWidget(): void {
    // Ocultar el elemento principal
    const widget = document.querySelector('elevenlabs-convai');
    if (widget) {
      (widget as HTMLElement).style.display = 'none';
      (widget as HTMLElement).style.visibility = 'hidden';
      (widget as HTMLElement).style.opacity = '0';
      (widget as HTMLElement).style.position = 'absolute';
      (widget as HTMLElement).style.left = '-9999px';
      (widget as HTMLElement).style.pointerEvents = 'none';
    }
    
    // Buscar y ocultar cualquier iframe relacionado (solo si contiene elevenlabs o convai)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      if (src.includes('elevenlabs') || src.includes('convai')) {
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
      }
    });
  }

  private fetch() {
    this.loading = true;
    this.n8nService.getScrapById(this.id).subscribe({
      next: (response) => {
        // getScrapById puede devolver un array o un objeto directo
        const c = Array.isArray(response) ? response[0] : response;
        this.consultoria = c;

        // payload_json puede ser string u objeto
        const raw = typeof c.payload_json === 'string'
          ? JSON.parse(c.payload_json)
          : c.payload_json;

        this.report = Array.isArray(raw) ? raw[0] : raw;

        // Desestructurar con tolerancia
        this.meta = this.report?.['meta'] ?? {};
        this.summary = this.report?.['summary'] ?? {};
        this.totales = this.summary?.['totales'] ?? {};
        this.scores = this.summary?.['lighthouse_scores'] ?? {};
        this.kpis = this.summary?.['kpis'] ?? {};
        this.topRisks = this.summary?.['top_risks'] ?? [];
        this.headings = this.report?.['headings'] ?? {};
        this.links = this.report?.['links'] ?? {};
        this.top_words = (this.report?.['top_words'] ?? []) as [string, number][];
        this.hallazgos = this.report?.['hallazgos_unificados'] ?? [];
        this.recomendaciones = this.report?.['recomendaciones_ia'] ?? [];
        this.quickWins = this.report?.['quick_wins'] ?? [];
        this.nextSteps = this.report?.['next_steps'] ?? [];

        this.updateProgress();
      },
      error: () => {},
      complete: () => (this.loading = false),
    });
  }

  // STEP logic
  goTo(s: number | string | undefined) {
    const stepNum = typeof s === 'string' ? Number(s) : (s ?? 0);
    this.step = Math.max(0, Math.min(3, stepNum));
    this.updateProgress();
    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  next() { 
    this.goTo(this.step + 1);
  }
  prev() { 
    this.goTo(this.step - 1);
  }

  private updateProgress() {
    // 4 pasos → 0, 33, 66, 100
    this.progress = (this.step / 3) * 100;
  }

  // Helpers UI
  getWordPercentage(freq: number, totalWords: number | null | undefined): string {
    const total = Number(totalWords ?? 0);
    if (!total || !freq) return '0.0';
    return ((freq / total) * 100).toFixed(1);
  }

  // "Answer first" - Conclusión inmediata con datos más relevantes
  getHeadline(): string {
    const riskCount = this.topRisks?.length ?? 0;
    if (riskCount > 0) {
      return `Hemos detectado ${riskCount} ${riskCount === 1 ? 'riesgo principal' : 'riesgos principales'} en tu web`;
    }
    
    const errs = this.totales?.['errores'] ?? 0;
    const perf = Math.round((this.scores?.['performance'] ?? 0) * 100);
    
    if (errs > 5) {
      return `Se han detectado ${errs} errores críticos que afectan tu rendimiento y SEO`;
    }
    if (perf < 70) {
      return 'Tu sitio tiene oportunidades claras de mejora en rendimiento y SEO';
    }
    return 'Tu base técnica es sólida. Hay oportunidades rápidas para optimizar y automatizar.';
  }

  getTopRisksCount(): number {
    return this.topRisks?.length ?? 0;
  }

  // Razones principales - Recomendaciones IA y top risks
  getReasons(): AnyObj[] {
    const reasons: AnyObj[] = [];
    
    // Agregar top risks como razones principales
    if (this.topRisks?.length) {
      this.topRisks.slice(0, 3).forEach(risk => {
        reasons.push({
          title: risk['titulo'],
          desc: risk['por_que_importa'],
          prioridad: risk['prioridad']
        });
      });
    }
    
    // Agregar recomendaciones IA si hay espacio
    if (reasons.length < 4 && this.recomendaciones?.length) {
      this.recomendaciones.slice(0, 4 - reasons.length).forEach(rec => {
        reasons.push({
          title: rec['titulo'],
          desc: rec['rationale'],
          prioridad: 'media'
        });
      });
    }

    return reasons.length ? reasons : [{
      title: 'Base correcta con margen de optimización',
      desc: 'Los datos sugieren mejoras rápidas en rendimiento, accesibilidad y SEO.',
      prioridad: 'media'
    }];
  }

  getPriorityColor(prioridad: string): string {
    const p = (prioridad || '').toLowerCase();
    if (p === 'alta') return 'danger';
    if (p === 'media') return 'warning';
    return 'info';
  }

  // Textos narrativos para cada sección
  getNarrativeText(step: number): string {
    switch (step) {
      case 0:
        return 'Estos son los datos más importantes de tu análisis. Aquí puedes ver de un vistazo el estado general de tu sitio web y los principales indicadores de rendimiento.';
      case 1:
        return 'Ahora vamos a profundizar en las causas específicas que explican estos resultados. Cada punto representa un área de mejora identificada por nuestra IA.';
      case 2:
        return 'La evidencia respalda cada una de nuestras conclusiones. Estos datos concretos te muestran exactamente qué está afectando el rendimiento de tu sitio.';
      case 3:
        return 'Ya conoces el diagnóstico. Ahora es momento de pasar a la acción. Te mostramos los pasos concretos que puedes tomar para mejorar tu sitio web.';
      default:
        return '';
    }
  }

  getStepTitle(step: number): string {
    switch (step) {
      case 0:
        return 'La Respuesta: Tu Diagnóstico en Segundos';
      case 1:
        return 'Las Razones: Por Qué Ocurre Esto';
      case 2:
        return 'La Evidencia: Datos que Lo Demuestran';
      case 3:
        return 'El Siguiente Paso: Tu Plan de Acción';
      default:
        return '';
    }
  }

  // Método para llamar al teléfono
  callPhone() {
    window.location.href = 'tel:+34632992220';
  }
}
