// src/app/core/pricing/pricing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, shareReplay } from 'rxjs';

export interface ModelPricing {
  pricing_id?: number;
  model_name: string;
  model_version?: string | null;
  family?: string | null;                   // 'gpt-5' | 'gpt-4o' | 'gemini' | 'claude' | ...
  tier?: string | null;                     // 'base' | 'mini' | 'nano' | 'flash' | ...
  price_input_per_mtok?: number | null;
  price_output_per_mtok?: number | null;
  price_image_per_unit?: number | null;
  price_audio_transc_per_min?: number | null;
  price_tts_per_1k_chars?: number | null;
  price_video_per_second?: number | null;
  currency: string;                         // 'USD'
  effective_date?: string;                  // ISO
  active?: boolean;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PricingService {
  private base = `${environment.apiUrl}/pricing`;

  // cachés simples (en memoria) para evitar peticiones repetidas
  private cacheAll$?: Observable<ModelPricing[]>;
  private cacheByFamily = new Map<string, Observable<ModelPricing[]>>();
  private cacheByModel = new Map<string, Observable<ModelPricing>>();

  constructor(private http: HttpClient) {}

  /** Todos los precios activos */
  getAll(force = false): Observable<ModelPricing[]> {
    if (!this.cacheAll$ || force) {
      this.cacheAll$ = this.http.get<ModelPricing[]>(`${this.base}`).pipe(shareReplay(1));
    }
    return this.cacheAll$;
  }

  /** Precios por familia (ej: 'gemini', 'gpt-5', 'claude') */
  getByFamily(family: string, force = false): Observable<ModelPricing[]> {
    const key = family.toLowerCase();
    if (!this.cacheByFamily.get(key) || force) {
      const req$ = this.http.get<ModelPricing[]>(`${this.base}/family/${encodeURIComponent(family)}`).pipe(shareReplay(1));
      this.cacheByFamily.set(key, req$);
    }
    return this.cacheByFamily.get(key)!;
  }

  /** Precio por modelo exacto (ej: 'gpt-5-mini') */
  getByModel(modelName: string, force = false): Observable<ModelPricing> {
    const key = modelName;
    if (!this.cacheByModel.get(key) || force) {
      const req$ = this.http.get<ModelPricing>(`${this.base}/model/${encodeURIComponent(modelName)}`).pipe(shareReplay(1));
      this.cacheByModel.set(key, req$);
    }
    return this.cacheByModel.get(key)!;
  }

  /** Limpia cachés si actualizas datos desde un panel admin */
  invalidateCache() {
    this.cacheAll$ = undefined;
    this.cacheByFamily.clear();
    this.cacheByModel.clear();
  }
}
