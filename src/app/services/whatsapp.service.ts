import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WhatsAppCredentialDTO {
  usuario_id: number;
  waba_id?: string | null;
  phone_number_id?: string | null;
  access_token?: string | null;      // lo envías solo al guardar/actualizar
  n8n_webhook_url?: string | null;
  default_recipient?: string | null;
  enabled?: boolean;
}

export interface SendWaPayload {
  usuario_id: number;
  to?: string;                       // si no lo mandas, el backend usará default_recipient
  message?: string;
  lead_id?: number;
  consultoria_id?: number;
  // Si tu n8n necesita recibir credenciales en cada llamada, añade: passCredentials: true
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private base = `${environment.apiUrl}`; // p.ej. http://localhost:4000

  constructor(private http: HttpClient) {}

  // GET /whatsapp/credentials/:usuario_id (devuelve SIN access_token)
  getCredentials(usuario_id: number): Observable<WhatsAppCredentialDTO> {
    return this.http.get<WhatsAppCredentialDTO>(`${this.base}/whatsapp/credentials/${usuario_id}`)
      .pipe(catchError(this.handle));
  }

  // POST /whatsapp/credentials  (upsert)
  upsertCredentials(dto: WhatsAppCredentialDTO): Observable<WhatsAppCredentialDTO> {
    return this.http.post<WhatsAppCredentialDTO>(`${this.base}/whatsapp/credentials`, dto)
      .pipe(catchError(this.handle));
  }

  // POST /whatsapp/test  (usa sendViaN8n en el backend)
  sendTest(payload: SendWaPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/whatsapp/test`, payload)
      .pipe(catchError(this.handle));
  }
  
  private handle(err: any) {
    console.error('WhatsAppService error:', err);
    return throwError(() => err);
  }
}
