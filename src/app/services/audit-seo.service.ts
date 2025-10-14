import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ====== Interfaces de resumen ======
export interface LighthouseSummary {
  fcp?: string;
  tbt?: string;
  tti?: string;
  lcp?: string;
  cls?: string;
  spi?: string;
}

export interface W3CResultSummary {
  errors: number;
  warnings: number;
}

@Injectable({ providedIn: 'root' })
export class AuditSeoService {

  // ====== ENDPOINTS DE TUS WEBHOOKS EN N8N (SUSTITUIR) ======
  private WEBHOOK_FETCH_HTML = 'https://TU_N8N/webhook/seo';        // type: 'fetch'
  private WEBHOOK_VALIDATE   = 'https://TU_N8N/webhook/seo';        // type: 'validate'
  private WEBHOOK_LIGHTHOUSE = 'https://TU_N8N/webhook/seo';        // type: 'lighthouse'
  private WEBHOOK_SERP       = 'https://TU_N8N/webhook/seo';        // type: 'serp'
  private WEBHOOK_GSC        = 'https://TU_N8N/webhook/seo';        // type: 'gsc'
  private WEBHOOK_ANALYZE    = 'https://TU_N8N/webhook/seo';        // type: 'analyze_all'

  constructor(private http: HttpClient) {}

  // === 0) Descargar HTML (equivale a getNewAudit) ===
  fetchHtml(url: string): Observable<string | any> {
    // Enviamos tipo fetch para que el Switch del workflow dispare el HTTP Request correspondiente
    return this.http.post(
      this.WEBHOOK_FETCH_HTML,
      { type: 'fetch', url },
      { responseType: 'text' as 'json' } // tu webhook puede devolver string puro (HTML) o JSON
    );
  }

  // === 1) W3C Validator ===
  validateW3C(url: string): Observable<any> {
    return this.http.post<any>(
      this.WEBHOOK_VALIDATE,
      { type: 'validate', url },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  // === 2) Lighthouse (PSI) ===
  lighthousePSI(url: string, psiKey: string): Observable<any> {
    return this.http.post<any>(
      this.WEBHOOK_LIGHTHOUSE,
      { type: 'lighthouse', url, psi_key: psiKey },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  // === 3) SERP (CSE) ===
  serpCSE(query: string, apiKey: string, cx: string): Observable<any> {
    return this.http.post<any>(
      this.WEBHOOK_SERP,
      { type: 'serp', busqueda: query, cse_key: apiKey, cse_cx: cx },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  // === 4) Search Console ===
  gscQuery(domainOrUrl: string, startDate: string, endDate: string): Observable<any> {
    // Si tu workflow espera dominio sin https, envía limpio:
    const cleaned = domainOrUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return this.http.post<any>(
      this.WEBHOOK_GSC,
      { type: 'gsc', url: cleaned, startDate, endDate },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  // === 5) Todo en uno (si montas un endpoint que lo haga) ===
  analyzeAll(payload: {
    url: string;
    busqueda?: string;
    psi_key?: string;
    cse_key?: string;
    cse_cx?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    return this.http.post<any>(
      this.WEBHOOK_ANALYZE,
      { type: 'analyze_all', ...payload },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  // ====== Mapeadores ======

  /** Mapea PageSpeed (PSI) -> tu LighthouseSummary */
  mapPSIToLighthouse(psi: any): LighthouseSummary {
    try {
      const audits = psi?.lighthouseResult?.audits || {};
      return {
        fcp: audits['first-contentful-paint']?.displayValue,
        tbt: audits['total-blocking-time']?.displayValue,
        tti: audits['interactive']?.displayValue,
        lcp: audits['largest-contentful-paint']?.displayValue,
        cls: audits['cumulative-layout-shift']?.displayValue,
        spi: audits['speed-index']?.displayValue,
      };
    } catch {
      return {};
    }
  }

  /** Mapea W3C (messages) -> contadores de errores/warnings */
  mapW3CToSummary(w3cJson: any): W3CResultSummary {
    const messages = w3cJson?.messages || [];
    const errors = messages.filter((m: any) => m.type === 'error').length;
    const warnings = messages.filter((m: any) => m.type !== 'error').length;
    return { errors, warnings };
    }

  /** Mapea CSE -> array de links */
  mapCSEToLinks(cseJson: any): string[] {
    const items = cseJson?.items || [];
    return items.map((i: any) => i.link).filter(Boolean);
  }
}
