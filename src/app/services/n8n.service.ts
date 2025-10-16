import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SeoAuditItem } from '../models/dataResponse';

@Injectable({
  providedIn: 'root'
})
export class N8nService {
  private apiUrl = 'https://n8n.srv975799.hstgr.cloud/webhook-test/3504c4f5-6828-4a08-ace0-049419793ec0';
  private base = `${environment.apiUrl}/messages`;
  
  constructor(private http: HttpClient) {}

  sendInput(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  triggerWebhook(type: string, text: string): Observable<any> {
    const body = { text }; // Puedes ampliar el objeto si necesitas más campos
    return this.http.post(`${environment.apiUrl}/webhooks/${type}`, body, { responseType: 'blob' });
  }

  puppeter(url: string, userId: number, leadId: number): Observable<any> {
    const body = { url: url, usuario_id: userId, lead_id: leadId }; // Puedes ampliar el objeto si necesitas más campos
    return this.http.post(`${environment.apiUrl}/webhooks/puppeter`, body);
  }

  getScraps(userId: number): Observable<any> {
    return this.http.get<SeoAuditItem[]>(`${environment.apiUrl}/webhooks/puppeter/${userId}`);
  }
}