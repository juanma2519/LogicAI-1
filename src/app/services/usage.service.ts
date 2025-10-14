import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UsageCreate {
  usuario_id: number;
  demo_key: string;     // 'text-to-image', 'image-to-video', etc.
  meta?: any;
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private base = `${environment.apiUrl}/usage`;

  constructor(private http: HttpClient) {}

  /** Registra un evento de uso */
  create(payload: UsageCreate) {
    return this.http.post(`${this.base}`, payload);
  }

  /** Resumen por usuario (para panel del cliente) */
  getUserSummary(userId: number | string) {
    return this.http.get(`${this.base}/user/${userId}/summary`);
  }

  /** Resumen global (para admin) */
  getAdminSummary() {
    return this.http.get(`${this.base}/admin/summary`);
  }
}
