// src/app/core/eleven/eleven.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';

/* ===== Modelos ===== */

export interface ElevenAgent {
  agent_id: string;
  name: string;               // nombre real (con sufijo en server)
  displayName?: string;       // nombre "limpio" que añade tu controller en list/get
  description?: string;
  voice_id?: string;
  llm_model?: string;
  temperature?: number;
  active?: boolean;
  // añade aquí si quieres tipar más campos que uses (tags, conversation_config, etc.)
}

export interface AgentsResponse {
  agents: ElevenAgent[];
  next_cursor?: string | null;
  has_more?: boolean;
}

export interface VoiceLabels {
  accent?: string;
  descriptive?: string;
  age?: string;
  gender?: string;
  language?: string;
  use_case?: string;
  [k: string]: any;
}

export interface ElevenVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: VoiceLabels;
  description?: string;
  preview_url?: string;
}

export interface VoicesResponse {
  voices: ElevenVoice[];
}

/* ===== Servicio ===== */

@Injectable({ providedIn: 'root' })
export class ElevenService {
  private base = `${environment.apiUrl}/eleven`;

  constructor(private http: HttpClient) {}

  /* ---------- Helpers de UI ---------- */

  /**
   * Devuelve siempre un nombre “mostrable”:
   * - usa displayName si viene del backend
   * - si no, cae a name
   */
  getDisplayName(a?: Pick<ElevenAgent, 'name' | 'displayName'> | null): string {
    if (!a) return '';
    return a.displayName || a.name || '';
  }

  /* ---------- Agents ---------- */

  listAgents(): Observable<AgentsResponse> {
    return this.http.get<AgentsResponse>(`${this.base}/agents`);
    // Tu controller ya devuelve { agents: [ { displayName } ], ... }
  }

  getAgent(id: string): Observable<ElevenAgent> {
    return this.http.get<ElevenAgent>(`${this.base}/agents/${id}`);
    // También devuelve displayName
  }

  /**
   * Acepta payload desde UI con `displayName` opcional.
   * Lo mapeamos a `name` para que el backend le añada el sufijo de usuario.
   */
  createAgent(payload: Partial<ElevenAgent> & { displayName?: string }): Observable<ElevenAgent> {
    const body: any = { ...payload };
    if (payload.displayName && !payload.name) {
      body.name = payload.displayName;
      delete body.displayName;
    }
    return this.http.post<ElevenAgent>(`${this.base}/agents`, body);
    // La respuesta de create del controller no incluye displayName; podrás mostrar this.getDisplayName(resp)
  }

  updateAgent(id: string, payload: Partial<ElevenAgent> & { displayName?: string }): Observable<ElevenAgent> {
    const body: any = { ...payload };
    if (payload.displayName) {
      body.name = payload.displayName; // el controller le re-aplicará el sufijo
      delete body.displayName;
    }
    return this.http.patch<ElevenAgent>(`${this.base}/agents/${id}`, body);
    // La respuesta de update no añade displayName; si lo necesitas en UI, usa getAgent tras guardar o muestra getDisplayName({name: resp.name, displayName: payload.displayName})
  }

  deleteAgent(id: string): Observable<any> {
    return this.http.delete(`${this.base}/agents/${id}`);
  }

  duplicateAgent(id: string): Observable<ElevenAgent> {
    return this.http.post<ElevenAgent>(`${this.base}/agents/${id}/duplicate`, {});
    // El controller puede no añadir displayName en duplicate; si lo quieres consistente:
    // .pipe(map(a => ({ ...a, displayName: a.displayName ?? a.name })))
  }

  simulateConversation(
    id: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  ): Observable<any> {
    return this.http.post<any>(`${this.base}/agents/${id}/simulate`, { messages });
  }

  /* ---------- Voices ---------- */

  listVoices(): Observable<VoicesResponse> {
    return this.http.get<VoicesResponse>(`${this.base}/voices`);
  }
}
