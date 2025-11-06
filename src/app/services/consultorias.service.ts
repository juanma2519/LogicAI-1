import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConsultoriaDto {
  id: number;
  lead_id: number | null;
  usuario_id: number;
  dominio: string;
  url: string;
  estrategia: string;
  status: string;
  n8n_execution_id: string | null;
  progreso: number;
  errores: number;
  warnings: number;
  oportunidades: number;
  score_performance: number | null;
  score_accessibility: number | null;
  score_best_practices: number | null;
  score_seo: number | null;
  LCP_ms: number | null;
  CLS: number | null;
  TBT_ms: number | null;
  INP_ms: number | null;
  FCP_ms: number | null;
  payload_json: string | any;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultoriasService {
  private base = `${environment.apiUrl}/consultorias`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<ConsultoriaDto> {
    return this.http.get<ConsultoriaDto>(`${this.base}/${id}`);
  }
}

