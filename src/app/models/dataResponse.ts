// Tipados mínimos para tu respuesta
export interface DataResponse {
  meta: { url: string; strategy: 'mobile' | 'desktop' | string };
  summary: {
    totales: { errores: number; warnings: number; oportunidades: number };
    lighthouse_scores: {
      performance: number; accessibility: number; best_practices: number; seo: number; pwa: number | null;
    };
    kpis: { LCP_ms: number | null; CLS: number | null; TBT_ms: number | null; INP_ms: number | null; FCP_ms: number | null };
    top_risks: Array<{ titulo: string; prioridad: string; por_que_importa: string }>;
  };
  hallazgos_unificados: Array<{
    id: string; fuente: string; tipo: string; categoria: string;
    titulo: string; mensaje: string; impacto_usuario: string; impacto_seo: string;
    esfuerzo: string; prioridad: string; owner_sugerido: string; como_solucionarlo?: string;
  }>;
  recomendaciones_ia?: Array<{ titulo: string; rationale: string; tareas?: string[]; owner_sugerido?: string }>;
  quick_wins?: Array<{ titulo: string; accion: string; beneficio_esperado?: string; kpi?: string; due_in_dias?: number }>;
  next_steps?: Array<{ titulo: string; tareas: string[]; owner?: string }>;
  headings?: {
    h1: number;
    h2: number;
    h3: number;
    samples: { h1: string[]; h2: string[]; h3: string[] };
  };
  links?: {
      internal: number;
      external: number;
      total: number;
      samples: { internal: string[]; external: string[] };
  };
  word_count?: number;
  top_words?: [string, number][];
  appendix?: any;

}

export type SeoAuditEstado = 'pendiente' | 'en_progreso' | 'completado' | 'error';
export type SeoAuditEstrategia = 'mobile' | 'desktop';

export interface SeoAuditItem {
  id: number;
  usuario_id: number;
  dominio: string;
  url: string;
  estrategia: SeoAuditEstrategia | null;
  status: SeoAuditEstado;
  errores:number;
  warnings:number;
  oportunidades:number;
  created_at: string;      // ISO
  finished_at?: string | null;
  payload_json: DataResponse;      // detalle completo cuando se pida por id
}