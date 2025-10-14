// ==============================
// file: leeds.service.ts (Angular)
// ==============================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Concepto { id: number; nombre: string; activo?: boolean; }
export interface Estado   { id: number; nombre: string; activo?: boolean; }
import { Lead } from '../models/lead';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class LeedsService {
  // Ajusta la URL base según tu entorno
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // ---- Catálogos ----
  getConceptos(): Observable<Concepto[]> {
    return this.http.get<Concepto[]>(`${this.baseUrl}/conceptos/`);
  }
  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.baseUrl}/estados/`);
  }

  // ---- Leads ----
  getLeadsByUser(userId: number): Observable<Lead[]> {
    return this.http.get<Lead[]>(`${this.baseUrl}/leads/user/${userId}`);
  }
  getLead(id: number): Observable<Lead> {
    return this.http.get<Lead>(`${this.baseUrl}/leads/${id}`);
  }
  createLeadByUser(userId: number, payload: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(`${this.baseUrl}/leads/user/${userId}`, payload);
  }
  updateLead(id: number, payload: Partial<Lead>): Observable<Lead> {
    return this.http.put<Lead>(`${this.baseUrl}/leads/${id}`, payload);
  }
  deleteLead(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/leads/${id}`);
  }

  // ---- Importador (opcional) ----
  importLeads(file: File): Observable<{ created: number; updated: number; errors: string[] }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ created: number; updated: number; errors: string[] }>(`${this.baseUrl}/import/leads/excel`, form);
  }

  generateLeads(userId: number, body: { negocio: string; ciudad: string }) {
    // endpoint en tu Node.js que dispara el webhook de n8n
    return this.http.post(`${this.baseUrl}/leads/generate/${userId}`, body);
  }
}
